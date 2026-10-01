import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditoriaEvento, type TipoEvento } from "./entities/auditoria-evento.entity";
import { Users } from "../auth/entities/user.entity";
import type { RequestOrigin } from "../termo/request-origin";
import {
    ALGORITMO,
    carregarChaveDoAmbiente,
    cifrar,
    sha256,
    type ChaveAuditoria,
} from "../termo/auditoria-cripto";

/** Chave do advisory lock da trilha de eventos (diferente da de aceites). */
const LOCK_KEY = 815_233_002;

/** Conteudo cifrado em `detalhes_cifrados`. */
export interface DetalhesEvento {
    origem: RequestOrigin;
    /** E-mail digitado no login (falhas). */
    emailInformado?: string;
    /** Motivo da falha: credenciais_invalidas | termo_versao_desatualizada | erro_interno */
    motivo?: string;
    /** Filtros usados na consulta a auditoria. */
    filtros?: Record<string, unknown>;
    /** Resultado resumido (ex.: verificacao de integridade). */
    resultado?: Record<string, unknown>;
    /** Identificador do token da sessao (login/logout). */
    sessaoJti?: string | null;
}

export interface NovoEvento {
    tipo: TipoEvento;
    usuario?: { id: number; email: string } | null;
    termoAceiteId?: string | null;
    detalhes: DetalhesEvento;
}

export function aadDoEvento(e: Pick<AuditoriaEvento, "tipo" | "userId" | "ocorridoEm">): string {
    return `${e.tipo}|${e.userId ?? ""}|${e.ocorridoEm.toISOString()}`;
}

export type CamposHashEvento = Omit<AuditoriaEvento, "id" | "hash" | "hashAnterior">;

/** SHA-256 do evento como gravado (inclui o texto cifrado), encadeado ao anterior. */
export function calcularHashEvento(c: CamposHashEvento, hashAnterior: string | null): string {
    return sha256(JSON.stringify([
        hashAnterior ?? "",
        c.tipo,
        c.userId,
        c.userEmail,
        c.ocorridoEm.toISOString(),
        c.termoAceiteId,
        c.detalhesCifrados,
        c.detalhesHash,
        c.criptoAlgoritmo,
        c.criptoChaveId,
    ]));
}

@Injectable()
export class AuditoriaEventosService {
    private readonly logger = new Logger(AuditoriaEventosService.name);
    private readonly chave: ChaveAuditoria;

    constructor(
        @InjectRepository(AuditoriaEvento)
        private readonly repo: Repository<AuditoriaEvento>,
        @InjectRepository(Users)
        private readonly users: Repository<Users>,
    ) {
        this.chave = carregarChaveDoAmbiente();
    }

    /** Grava o evento. Lanca erro se nao conseguir (use `registrarSemFalhar` quando for opcional). */
    async registrar(evento: NovoEvento): Promise<AuditoriaEvento> {
        const detalhesJson = JSON.stringify(evento.detalhes);

        return this.repo.manager.transaction(async (em) => {
            await em.query("SELECT pg_advisory_xact_lock($1)", [LOCK_KEY]);
            const tabela = em.getRepository(AuditoriaEvento);

            const [ultimo] = await tabela.find({ select: { id: true, hash: true }, order: { id: "DESC" }, take: 1 });
            const hashAnterior = ultimo?.hash ?? null;

            const base = {
                tipo:          evento.tipo,
                userId:        evento.usuario?.id ?? null,
                userEmail:     evento.usuario?.email?.slice(0, 255) ?? null,
                ocorridoEm:    new Date(),
                termoAceiteId: evento.termoAceiteId ?? null,
            };
            const campos: CamposHashEvento = {
                ...base,
                detalhesCifrados: cifrar(detalhesJson, this.chave.chave, aadDoEvento(base)),
                detalhesHash:     sha256(detalhesJson),
                criptoAlgoritmo:  ALGORITMO,
                criptoChaveId:    this.chave.id,
            };
            const hash = calcularHashEvento(campos, hashAnterior);
            return tabela.save(tabela.create({ ...campos, hashAnterior, hash }));
        });
    }

    /** Versao que nunca interrompe o fluxo principal — falha vira log de erro. */
    async registrarSemFalhar(evento: NovoEvento): Promise<void> {
        try {
            await this.registrar(evento);
        } catch (err) {
            this.logger.error(`Falha ao registrar evento ${evento.tipo}: ${(err as Error).message}`);
        }
    }

    /** Falha de login: identifica o usuario pelo e-mail digitado, se existir. */
    async registrarFalhaLogin(emailInformado: string, motivo: string, origem: RequestOrigin): Promise<void> {
        const email = (emailInformado ?? "").trim().slice(0, 255);
        let usuario: { id: number; email: string } | null = null;
        try {
            const u = email ? await this.users.findOne({ where: { email }, select: { id: true, email: true } }) : null;
            if (u) usuario = { id: u.id, email: u.email };
        } catch { /* consulta opcional */ }

        await this.registrarSemFalhar({
            tipo: "LOGIN_FALHA",
            usuario,
            detalhes: { origem, emailInformado: email, motivo },
        });
    }
}
