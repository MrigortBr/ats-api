import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Sessao de login. Cada refresh gera uma linha nova e revoga a anterior (rotacao).
 *
 * - `tokenHash`: SHA-256 do refresh token opaco (o valor bruto so existe no cookie).
 * - `csrfHash`: SHA-256 do token CSRF vigente da sessao (usado em /auth/refresh e /auth/logout,
 *   onde o JWT de acesso pode ja ter expirado e nao ha claim para conferir).
 * - `sessionStartedAt`: inicio da cadeia (login original), base do teto absoluto.
 * - `lastUsedAt`: base do timeout por inatividade.
 */
@Entity("sessoes")
export class Sessao {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "user_id", type: "integer" })
    userId!: number;

    @Column({ name: "token_hash", type: "char", length: 64, unique: true })
    tokenHash!: string;

    @Column({ name: "csrf_hash", type: "char", length: 64 })
    csrfHash!: string;

    @Column({ name: "session_started_at", type: "timestamptz" })
    sessionStartedAt!: Date;

    @Column({ name: "last_used_at", type: "timestamptz" })
    lastUsedAt!: Date;

    @Column({ name: "expires_at", type: "timestamptz" })
    expiresAt!: Date;

    @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
    revokedAt!: Date | null;

    /** logout | rotacionada | reuso | usuario_removido | senha_alterada | expirada */
    @Column({ name: "revoked_reason", type: "varchar", length: 30, nullable: true })
    revokedReason!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
