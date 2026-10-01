import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TermoAceite } from "./entities/termo-aceite.entity";
import { AceiteTermoDto } from "./dto/aceite-termo.dto";
import type { RequestOrigin } from "./request-origin";
import {
    ALGORITMO,
    carregarChaveDoAmbiente,
    cifrar,
    sha256,
    type ChaveAuditoria,
} from "./auditoria-cripto";
import {
    TERMO_FUSO_EXIBICAO,
    TERMO_HASH,
    TERMO_ITENS,
    TERMO_VERSAO,
} from "./termo.constants";

/** Chave do advisory lock que serializa a gravacao (mantem o encadeamento de hash consistente). */
const LOCK_KEY = 815_233_001;

export interface UsuarioAssinante {
    id: number;
    name: string;
    surname?: string | null;
    email: string;
}

export interface AceiteRegistrado {
    id: string;
    versao: string;
    /** Horario oficial da assinatura (servidor), ISO 8601 com fuso de Brasilia. */
    assinadoEm: string;
    hash: string;
}

/** Conteudo que vai cifrado em `dados_acesso_cifrados`. */
export interface DadosAcesso {
    origem: RequestOrigin;
    cliente: {
        navegador: string | null;
        navegadorVersao: string | null;
        sistemaOperacional: string | null;
        tipoDispositivo: string | null;
        idioma: string | null;
        idiomas: string[] | null;
        fusoHorario: string | null;
        offsetMinutos: number | null;
        resolucaoTela: string | null;
        pixelRatio: number | null;
    };
    localizacao: {
        status: string;
        latitude: number | null;
        longitude: number | null;
        precisaoMetros: number | null;
    };
    /** Localizacao aproximada por IP — reservado (preenchido quando houver base de geo-IP). */
    localizacaoIp: { pais: string | null; uf: string | null; municipio: string | null } | null;
}

/**
 * Formata uma data em ISO 8601 com o offset do fuso informado.
 * Ex.: 2026-10-01T08:51:37.214-03:00
 */
export function toIsoWithOffset(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "longOffset",
    }).formatToParts(date);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
    const offsetRaw = get("timeZoneName").replace("GMT", "");
    const offset = offsetRaw === "" ? "+00:00" : offsetRaw;
    const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}.${ms}${offset}`;
}

/**
 * Dados adicionais autenticados do AES-GCM: amarram o conteudo cifrado ao
 * registro (usuario + termo + horario). Copiar o campo para outra linha faz a
 * decifragem falhar.
 */
export function aadDoRegistro(r: Pick<TermoAceite, "userId" | "termoHash" | "assinadoEmServidor">): string {
    return `${r.userId}|${r.termoHash}|${r.assinadoEmServidor.toISOString()}`;
}

/** Campos gravados que entram no hash do registro, em ordem fixa. */
export type CamposHash = Omit<TermoAceite, "id" | "hash" | "hashAnterior">;

/**
 * SHA-256 do registro como gravado (inclui o texto cifrado), encadeado ao anterior.
 * Permite verificar a cadeia sem precisar da chave de criptografia.
 */
export function calcularHashRegistro(c: CamposHash, hashAnterior: string | null): string {
    return sha256(JSON.stringify([
        hashAnterior ?? "",
        c.userId,
        c.userNome,
        c.userEmail,
        c.termoVersao,
        c.termoHash,
        c.itens,
        c.assinadoEmServidor.toISOString(),
        c.assinadoEmCliente.toISOString(),
        c.assinadoEmClienteTexto,
        c.dadosAcessoCifrados,
        c.dadosAcessoHash,
        c.criptoAlgoritmo,
        c.criptoChaveId,
    ]));
}

@Injectable()
export class TermoAceiteService {
    private readonly chave: ChaveAuditoria;

    constructor(
        @InjectRepository(TermoAceite)
        private readonly repo: Repository<TermoAceite>,
    ) {
        // Falha na inicializacao da API se a chave nao estiver configurada.
        this.chave = carregarChaveDoAmbiente();
    }

    /** Recusa aceites de uma versao diferente da vigente (frontend desatualizado). */
    assertVersaoVigente(versao: string): void {
        if (versao !== TERMO_VERSAO) {
            throw new ConflictException(
                `O termo foi atualizado (versao vigente ${TERMO_VERSAO}). Recarregue a pagina e aceite novamente.`,
            );
        }
    }

    /**
     * Grava a assinatura do termo. Executa em transacao com advisory lock para
     * que dois logins simultaneos nao leiam o mesmo hash anterior.
     */
    async registrar(
        usuario: UsuarioAssinante,
        aceite: AceiteTermoDto,
        origem: RequestOrigin,
    ): Promise<AceiteRegistrado> {
        this.assertVersaoVigente(aceite.versao);

        const cliente = aceite.cliente ?? {};
        const geo = aceite.localizacao;
        const geoConcedida = geo.status === "concedida";

        const dados: DadosAcesso = {
            origem,
            cliente: {
                navegador:          cliente.navegador ?? null,
                navegadorVersao:    cliente.navegadorVersao ?? null,
                sistemaOperacional: cliente.sistemaOperacional ?? null,
                tipoDispositivo:    cliente.tipoDispositivo ?? null,
                idioma:             cliente.idioma ?? null,
                idiomas:            cliente.idiomas ?? null,
                fusoHorario:        cliente.fusoHorario ?? null,
                offsetMinutos:      cliente.offsetMinutos ?? null,
                resolucaoTela:      cliente.resolucaoTela ?? null,
                pixelRatio:         cliente.pixelRatio ?? null,
            },
            localizacao: {
                status:         geo.status,
                latitude:       geoConcedida ? geo.latitude ?? null : null,
                longitude:      geoConcedida ? geo.longitude ?? null : null,
                precisaoMetros: geoConcedida ? geo.precisaoMetros ?? null : null,
            },
            localizacaoIp: null,
        };
        const dadosJson = JSON.stringify(dados);

        return this.repo.manager.transaction(async (em) => {
            await em.query("SELECT pg_advisory_xact_lock($1)", [LOCK_KEY]);

            const tabela = em.getRepository(TermoAceite);
            const [ultimo] = await tabela.find({
                select: { id: true, hash: true },
                order:  { id: "DESC" },
                take:   1,
            });
            const hashAnterior = ultimo?.hash ?? null;

            // Horario oficial lido dentro do lock — a ordem dos ids segue a ordem dos horarios.
            const base = {
                userId:                 usuario.id,
                userNome:               [usuario.name, usuario.surname].filter(Boolean).join(" ").slice(0, 255),
                userEmail:              usuario.email.slice(0, 255),
                termoVersao:            TERMO_VERSAO,
                termoHash:              TERMO_HASH,
                itens:                  [...TERMO_ITENS],
                assinadoEmServidor:     new Date(),
                assinadoEmCliente:      new Date(aceite.assinadoEm),
                assinadoEmClienteTexto: aceite.assinadoEm,
            };

            const campos: CamposHash = {
                ...base,
                dadosAcessoCifrados: cifrar(dadosJson, this.chave.chave, aadDoRegistro(base)),
                dadosAcessoHash:     sha256(dadosJson),
                criptoAlgoritmo:     ALGORITMO,
                criptoChaveId:       this.chave.id,
            };

            const hash = calcularHashRegistro(campos, hashAnterior);
            const salvo = await tabela.save(tabela.create({ ...campos, hashAnterior, hash }));

            return {
                id:         salvo.id,
                versao:     salvo.termoVersao,
                assinadoEm: toIsoWithOffset(base.assinadoEmServidor, TERMO_FUSO_EXIBICAO),
                hash,
            };
        });
    }
}
