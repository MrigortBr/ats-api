import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Sessoes de login (refresh token opaco rotativo).
 *
 * SOMENTE ADITIVA — cria tabela e indices novos; nao altera nenhuma tabela existente.
 * Pode ser aplicada antes do deploy da nova versao da API (a versao atual a ignora).
 * Idempotente.
 */
export class CreateSessoes1700000061000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sessoes" (
                "id"                 BIGSERIAL PRIMARY KEY,
                "user_id"            INTEGER        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "token_hash"         CHAR(64)       NOT NULL,
                "csrf_hash"          CHAR(64)       NOT NULL,
                "session_started_at" TIMESTAMPTZ    NOT NULL,
                "last_used_at"       TIMESTAMPTZ    NOT NULL,
                "expires_at"         TIMESTAMPTZ    NOT NULL,
                "revoked_at"         TIMESTAMPTZ,
                "revoked_reason"     VARCHAR(30),
                "created_at"         TIMESTAMPTZ    NOT NULL DEFAULT now(),
                CONSTRAINT "uq_sessoes_token_hash" UNIQUE ("token_hash")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_sessoes_user" ON "sessoes" ("user_id") WHERE "revoked_at" IS NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_sessoes_expires" ON "sessoes" ("expires_at")`,
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessoes_expires"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessoes_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sessoes"`);
    }
}
