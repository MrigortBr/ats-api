import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Registro de assinatura do Termo de Uso.
 *
 * SOMENTE ADITIVA — cria schema, tabela, indices, funcao e trigger novos.
 * Nao altera nenhuma tabela existente, entao pode ser aplicada em producao
 * antes do deploy da nova versao da API (a versao atual simplesmente ignora
 * esta tabela). Todos os comandos sao idempotentes.
 *
 * A tabela e somente de inclusao: UPDATE, DELETE e TRUNCATE sao bloqueados
 * por trigger, inclusive para o usuario da aplicacao.
 *
 * IP, navegador/dispositivo e localizacao ficam em "dados_acesso_cifrados"
 * (AES-256-GCM, chave em AUDITORIA_CHAVE fora do banco).
 */
export class CreateTermoAceites1700000057000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "auditoria"`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "auditoria"."termo_aceites" (
                "id"                        BIGSERIAL PRIMARY KEY,

                "user_id"                   INTEGER        NOT NULL,
                "user_nome"                 VARCHAR(255)   NOT NULL,
                "user_email"                VARCHAR(255)   NOT NULL,

                "termo_versao"              VARCHAR(20)    NOT NULL,
                "termo_hash"                CHAR(64)       NOT NULL,
                "itens"                     JSONB          NOT NULL,

                "assinado_em_servidor"      TIMESTAMPTZ(3) NOT NULL,
                "assinado_em_cliente"       TIMESTAMPTZ(3) NOT NULL,
                "assinado_em_cliente_texto" VARCHAR(40)    NOT NULL,

                "dados_acesso_cifrados"     TEXT           NOT NULL,
                "dados_acesso_hash"         CHAR(64)       NOT NULL,
                "cripto_algoritmo"          VARCHAR(20)    NOT NULL,
                "cripto_chave_id"           VARCHAR(20)    NOT NULL,

                "hash_anterior"             CHAR(64),
                "hash"                      CHAR(64)       NOT NULL,

                CONSTRAINT "uq_termo_aceites_hash" UNIQUE ("hash"),
                CONSTRAINT "fk_termo_aceites_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_termo_aceites_user"
            ON "auditoria"."termo_aceites" ("user_id", "assinado_em_servidor" DESC)
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

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS "trg_termo_aceites_imutavel" ON "auditoria"."termo_aceites"
        `);
        await queryRunner.query(`
            CREATE TRIGGER "trg_termo_aceites_imutavel"
            BEFORE UPDATE OR DELETE ON "auditoria"."termo_aceites"
            FOR EACH ROW EXECUTE FUNCTION "auditoria"."fn_bloquear_alteracao"()
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS "trg_termo_aceites_sem_truncate" ON "auditoria"."termo_aceites"
        `);
        await queryRunner.query(`
            CREATE TRIGGER "trg_termo_aceites_sem_truncate"
            BEFORE TRUNCATE ON "auditoria"."termo_aceites"
            FOR EACH STATEMENT EXECUTE FUNCTION "auditoria"."fn_bloquear_alteracao"()
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Atencao: apaga a trilha de aceites. Use apenas em ambiente de desenvolvimento.
        await queryRunner.query(`DROP TABLE IF EXISTS "auditoria"."termo_aceites"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS "auditoria"."fn_bloquear_alteracao"()`);
    }
}
