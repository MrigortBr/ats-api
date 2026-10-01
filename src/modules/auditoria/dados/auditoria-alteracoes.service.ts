import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditoriaAlteracao, type AcaoDados, type ModuloAuditado } from "../entities/auditoria-alteracao.entity";
import type { RequestOrigin } from "../../termo/request-origin";
import type { MudancaEntidade } from "./contexto";
import {
    ALGORITMO,
    carregarChaveDoAmbiente,
    cifrar,
    sha256,
    type ChaveAuditoria,
} from "../../termo/auditoria-cripto";

const LOCK_KEY = 815_233_003;

/** Conteudo cifrado em `detalhes_cifrados`. */
export interface DetalhesAlteracao {
    origem: RequestOrigin;
    url: string;
    parametros: Record<string, string>;
    consulta: Record<string, unknown>;
    /** Corpo enviado pelo usuario (sanitizado: sem senhas, binarios resumidos). */
    corpo: unknown;
    /** Metadados do arquivo enviado (upload). */
    arquivo?: { nome: string; tipo: string; tamanho: number } | null;
    mudancas: MudancaEntidade[];
    mudancasOmitidas: number;
    /** Resumo da resposta (id criado, quantidade) ou mensagem de erro. */
    resposta?: Record<string, unknown> | null;
    erro?: string | null;
}

export interface NovaAlteracao {
    usuario: { id: number; email: string } | null;
    modulo: ModuloAuditado;
    acao: AcaoDados;
    metodo: string;
    rota: string;
    registroRef: string | null;
    statusHttp: number;
    sucesso: boolean;
    detalhes: DetalhesAlteracao;
}

export type CamposHashAlteracao = Omit<AuditoriaAlteracao, "id" | "hash" | "hashAnterior">;

export function aadDaAlteracao(a: Pick<AuditoriaAlteracao, "modulo" | "rota" | "userId" | "ocorridoEm">): string {
    return `${a.modulo}|${a.rota}|${a.userId ?? ""}|${a.ocorridoEm.toISOString()}`;
}

export function calcularHashAlteracao(c: CamposHashAlteracao, hashAnterior: string | null): string {
    return sha256(JSON.stringify([
        hashAnterior ?? "",
        c.ocorridoEm.toISOString(),
        c.userId,
        c.userEmail,
        c.modulo,
        c.acao,
        c.metodo,
        c.rota,
        c.registroRef,
        c.statusHttp,
        c.sucesso,
        c.qtdMudancas,
        c.detalhesCifrados,
        c.detalhesHash,
        c.criptoAlgoritmo,
        c.criptoChaveId,
    ]));
}

@Injectable()
export class AuditoriaAlteracoesService {
    private readonly logger = new Logger(AuditoriaAlteracoesService.name);
    private readonly chave: ChaveAuditoria;

    constructor(
        @InjectRepository(AuditoriaAlteracao)
        private readonly repo: Repository<AuditoriaAlteracao>,
    ) {
        this.chave = carregarChaveDoAmbiente();
    }

    async registrar(nova: NovaAlteracao): Promise<AuditoriaAlteracao> {
        const json = JSON.stringify(nova.detalhes);

        return this.repo.manager.transaction(async (em) => {
            await em.query("SELECT pg_advisory_xact_lock($1)", [LOCK_KEY]);
            const tabela = em.getRepository(AuditoriaAlteracao);
            const [ultimo] = await tabela.find({ select: { id: true, hash: true }, order: { id: "DESC" }, take: 1 });
            const hashAnterior = ultimo?.hash ?? null;

            const base = {
                ocorridoEm:  new Date(),
                userId:      nova.usuario?.id ?? null,
                userEmail:   nova.usuario?.email?.slice(0, 255) ?? null,
                modulo:      nova.modulo,
                acao:        nova.acao,
                metodo:      nova.metodo,
                rota:        nova.rota.slice(0, 255),
                registroRef: nova.registroRef?.slice(0, 255) ?? null,
                statusHttp:  nova.statusHttp,
                sucesso:     nova.sucesso,
                qtdMudancas: nova.detalhes.mudancas.length + nova.detalhes.mudancasOmitidas,
            };
            const campos: CamposHashAlteracao = {
                ...base,
                detalhesCifrados: cifrar(json, this.chave.chave, aadDaAlteracao(base)),
                detalhesHash:     sha256(json),
                criptoAlgoritmo:  ALGORITMO,
                criptoChaveId:    this.chave.id,
            };
            const hash = calcularHashAlteracao(campos, hashAnterior);
            return tabela.save(tabela.create({ ...campos, hashAnterior, hash }));
        });
    }

    /** Nunca interrompe a resposta ao usuario — falha vira log de erro. */
    async registrarSemFalhar(nova: NovaAlteracao): Promise<void> {
        try {
            await this.registrar(nova);
        } catch (err) {
            this.logger.error(`Falha ao registrar alteracao ${nova.metodo} ${nova.rota}: ${(err as Error).message}`);
        }
    }
}
