import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Aparelhos DECAN: equipamentos de oncologia entregues pelo DECAN/MS (2023–2026).
 * Guarda só os dados da entrega (sem produção). Fonte: relatório "Entregas de equipamentos em oncologia 2023–2026".
 * categoria: ACE (acelerador linear), MAM (mamógrafo), BRA (braquiterapia), PET (PET-CT), RM (ressonância), TC (tomógrafo).
 */
export class CreateAparelhoDecan1700000086000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "aparelho_decan" (
                "id" SERIAL PRIMARY KEY,
                "id_relatorio" VARCHAR NOT NULL,
                "categoria" VARCHAR(3) NOT NULL,
                "instrumento" VARCHAR NULL,
                "uf" VARCHAR(2) NOT NULL,
                "municipio" VARCHAR NOT NULL,
                "estabelecimento" VARCHAR NOT NULL,
                "ano_entrega" SMALLINT NOT NULL,
                "quantidade" INTEGER NOT NULL DEFAULT 1,
                "valor" NUMERIC(14,2) NULL,
                "cnes" VARCHAR NULL,
                "nome_cnes" VARCHAR NULL,
                "habilitacao_cod" VARCHAR NULL,
                "habilitacao_descricao" VARCHAR NULL,
                "habilitacao_tipo" VARCHAR NULL,
                "habilitacao_ano" SMALLINT NULL,
                "no_cnes" BOOLEAN NULL,
                "qtd_no_cnes" INTEGER NULL,
                "obs" TEXT NULL,
                "producao_2022_freq" INTEGER NULL,
                "producao_2022_valor" NUMERIC(14,2) NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "uq_aparelho_decan_id_relatorio" UNIQUE ("id_relatorio"),
                CONSTRAINT "ck_aparelho_decan_categoria" CHECK ("categoria" IN ('ACE','MAM','BRA','PET','RM','TC'))
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_aparelho_decan_categoria" ON "aparelho_decan" ("categoria")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_aparelho_decan_cnes" ON "aparelho_decan" ("cnes")`);

        // Produção SIA mensal do ESTABELECIMENTO (não do equipamento), como no relatório: frequência e valor aprovados.
        // Entregas com o mesmo CNES e categoria repetem a mesma série (não somar por categoria sem deduplicar).
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "aparelho_decan_producao_mensal" (
                "id" SERIAL PRIMARY KEY,
                "id_relatorio" VARCHAR NOT NULL REFERENCES "aparelho_decan"("id_relatorio") ON DELETE CASCADE,
                "competencia" CHAR(6) NOT NULL,
                "frequencia" INTEGER NOT NULL,
                "valor" NUMERIC(14,2) NOT NULL,
                CONSTRAINT "uq_aparelho_decan_producao_mensal" UNIQUE ("id_relatorio", "competencia")
            )
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "aparelho_decan_producao_mensal"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "aparelho_decan"`);
    }
}
