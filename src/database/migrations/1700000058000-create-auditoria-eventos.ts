import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Trilha de eventos de acesso (login, falha de login, logout e consultas a auditoria).
 *
 * SOMENTE ADITIVA — cria tabela, indices e triggers novos no schema "auditoria".
 * Nao altera nenhuma tabela existente; pode ser aplicada em producao antes do
 * deploy da nova versao. Todos os comandos sao idempotentes.
 *
 * Tambem cria indice de data em "auditoria.termo_aceites" (tabela nova, da
 * migration 1700000057000) para os filtros por periodo da tela de auditoria.
 */
export class CreateAuditoriaEventos1700000058000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "auditoria"`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "auditoria"."eventos" (
                "id"                BIGSERIAL PRIMARY KEY,
                "tipo"              VARCHAR(40)    NOT NULL,
                "user_id"           INTEGER,
                "user_email"        VARCHAR(255),
                "ocorrido_em"       TIMESTAMPTZ(3) NOT NULL,
                "termo_aceite_id"   BIGINT,

                "detalhes_cifrados" TEXT           NOT NULL,
                "detalhes_hash"     CHAR(64)       NOT NULL,
                "cripto_algoritmo"  VARCHAR(20)    NOT NULL,
                "cripto_chave_id"   VARCHAR(20)    NOT NULL,

                "hash_anterior"     CHAR(64),
                "hash"              CHAR(64)       NOT NULL,

                CONSTRAINT "uq_auditoria_eventos_hash" UNIQUE ("hash")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_auditoria_eventos_ocorrido"
            ON "auditoria"."eventos" ("ocorrido_em" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_auditoria_eventos_tipo"
            ON "auditoria"."eventos" ("tipo", "ocorrido_em" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_auditoria_eventos_user"
            ON "auditoria"."eventos" ("user_id", "ocorrido_em" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_termo_aceites_assinado"
            ON "auditoria"."termo_aceites" ("assinado_em_servidor" DESC)
        `);

        // Mesma funcao da migration 1700000057000 (recriada aqui para nao depender da ordem).
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION "auditoria"."fn_bloquear_alteracao"()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                RAISE EXCEPTION 'Tabela %.% e somente inclusao (operacao % bloqueada)',
                    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP;
            END;
            $$
        `);

        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_auditoria_eventos_imutavel" ON "auditoria"."eventos"`);
        await queryRunner.query(`
            CREATE TRIGGER "trg_auditoria_eventos_imutavel"
            BEFORE UPDATE OR DELETE ON "auditoria"."eventos"
            FOR EACH ROW EXECUTE FUNCTION "auditoria"."fn_bloquear_alteracao"()
        `);

        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_auditoria_eventos_sem_truncate" ON "auditoria"."eventos"`);
        await queryRunner.query(`
            CREATE TRIGGER "trg_auditoria_eventos_sem_truncate"
            BEFORE TRUNCATE ON "auditoria"."eventos"
            FOR EACH STATEMENT EXECUTE FUNCTION "auditoria"."fn_bloquear_alteracao"()
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Atencao: apaga a trilha de eventos. Use apenas em ambiente de desenvolvimento.
        await queryRunner.query(`DROP INDEX IF EXISTS "auditoria"."idx_termo_aceites_assinado"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "auditoria"."eventos"`);
    }
}
