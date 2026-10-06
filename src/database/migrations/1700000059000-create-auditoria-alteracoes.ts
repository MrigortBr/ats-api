import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Trilha de alteracoes e downloads de dados (transporte sanitario, equipamentos,
 * painel da empresa e cadastros administrativos).
 *
 * SOMENTE ADITIVA — cria tabela, indices e triggers novos no schema "auditoria".
 * Nao altera nenhuma tabela existente; pode ser aplicada em producao antes do
 * deploy da nova versao. Todos os comandos sao idempotentes.
 */
export class CreateAuditoriaAlteracoes1700000059000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "auditoria"`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "auditoria"."alteracoes" (
                "id"                BIGSERIAL PRIMARY KEY,
                "ocorrido_em"       TIMESTAMPTZ(3) NOT NULL,
                "user_id"           INTEGER,
                "user_email"        VARCHAR(255),

                "modulo"            VARCHAR(30)    NOT NULL,
                "acao"              VARCHAR(30)    NOT NULL,
                "metodo"            VARCHAR(10)    NOT NULL,
                "rota"              VARCHAR(255)   NOT NULL,
                "registro_ref"      VARCHAR(255),
                "status_http"       INTEGER        NOT NULL,
                "sucesso"           BOOLEAN        NOT NULL,
                "qtd_mudancas"      INTEGER        NOT NULL,

                "detalhes_cifrados" TEXT           NOT NULL,
                "detalhes_hash"     CHAR(64)       NOT NULL,
                "cripto_algoritmo"  VARCHAR(20)    NOT NULL,
                "cripto_chave_id"   VARCHAR(20)    NOT NULL,

                "hash_anterior"     CHAR(64),
                "hash"              CHAR(64)       NOT NULL,

                CONSTRAINT "uq_auditoria_alteracoes_hash" UNIQUE ("hash")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_auditoria_alteracoes_ocorrido"
            ON "auditoria"."alteracoes" ("ocorrido_em" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_auditoria_alteracoes_modulo"
            ON "auditoria"."alteracoes" ("modulo", "ocorrido_em" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_auditoria_alteracoes_user"
            ON "auditoria"."alteracoes" ("user_id", "ocorrido_em" DESC)
        `);

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

        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_auditoria_alteracoes_imutavel" ON "auditoria"."alteracoes"`);
        await queryRunner.query(`
            CREATE TRIGGER "trg_auditoria_alteracoes_imutavel"
            BEFORE UPDATE OR DELETE ON "auditoria"."alteracoes"
            FOR EACH ROW EXECUTE FUNCTION "auditoria"."fn_bloquear_alteracao"()
        `);
        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_auditoria_alteracoes_sem_truncate" ON "auditoria"."alteracoes"`);
        await queryRunner.query(`
            CREATE TRIGGER "trg_auditoria_alteracoes_sem_truncate"
            BEFORE TRUNCATE ON "auditoria"."alteracoes"
            FOR EACH STATEMENT EXECUTE FUNCTION "auditoria"."fn_bloquear_alteracao"()
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Atencao: apaga a trilha de alteracoes. Use apenas em ambiente de desenvolvimento.
        await queryRunner.query(`DROP TABLE IF EXISTS "auditoria"."alteracoes"`);
    }
}
