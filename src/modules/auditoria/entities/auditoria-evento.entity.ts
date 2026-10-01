import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/** Tipos de evento registrados na trilha. */
export const TIPOS_EVENTO = [
    "LOGIN_SUCESSO",
    "LOGIN_FALHA",
    "LOGOUT",
    "AUDITORIA_CONSULTA",
    "AUDITORIA_VERIFICACAO",
] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

/**
 * Trilha de eventos de acesso (somente inclusao).
 *
 * Tabela nova no schema "auditoria" — nao altera tabelas existentes.
 * UPDATE, DELETE e TRUNCATE bloqueados por trigger (migration 1700000058000).
 * Origem da requisicao e detalhes ficam cifrados (AES-256-GCM).
 */
@Entity({ schema: "auditoria", name: "eventos" })
export class AuditoriaEvento {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "tipo", type: "varchar", length: 40 })
    tipo!: TipoEvento;

    /** Usuario identificado (nulo em falha de login com e-mail inexistente). */
    @Column({ name: "user_id", type: "integer", nullable: true })
    userId!: number | null;

    @Column({ name: "user_email", type: "varchar", length: 255, nullable: true })
    userEmail!: string | null;

    /** Relogio do servidor. */
    @Column({ name: "ocorrido_em", type: "timestamptz", precision: 3 })
    ocorridoEm!: Date;

    /** Assinatura do termo associada (eventos LOGIN_SUCESSO). */
    @Column({ name: "termo_aceite_id", type: "bigint", nullable: true })
    termoAceiteId!: string | null;

    /** JSON com origem (IP, User-Agent...) e detalhes do evento — AES-256-GCM, base64. */
    @Column({ name: "detalhes_cifrados", type: "text" })
    detalhesCifrados!: string;

    @Column({ name: "detalhes_hash", type: "char", length: 64 })
    detalhesHash!: string;

    @Column({ name: "cripto_algoritmo", type: "varchar", length: 20 })
    criptoAlgoritmo!: string;

    @Column({ name: "cripto_chave_id", type: "varchar", length: 20 })
    criptoChaveId!: string;

    @Column({ name: "hash_anterior", type: "char", length: 64, nullable: true })
    hashAnterior!: string | null;

    @Column({ name: "hash", type: "char", length: 64, unique: true })
    hash!: string;
}
