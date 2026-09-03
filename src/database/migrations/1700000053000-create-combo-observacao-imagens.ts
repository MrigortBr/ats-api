import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateComboObservacaoImagens1700000053000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "combo_equipamento_observacao_imagens" (
                "id" SERIAL PRIMARY KEY,
                "observacao_id" INTEGER NOT NULL REFERENCES "combo_equipamento_observacoes"("id") ON DELETE CASCADE,
                "filename" VARCHAR NOT NULL,
                "mimetype" VARCHAR NOT NULL,
                "size" INTEGER NOT NULL,
                "data" BYTEA NOT NULL,
                "uploaded_by" VARCHAR NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_combo_equipamento_observacao_imagens_observacao_id" ON "combo_equipamento_observacao_imagens" ("observacao_id")`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "combo_estabelecimento_observacao_imagens" (
                "id" SERIAL PRIMARY KEY,
                "observacao_id" INTEGER NOT NULL REFERENCES "combo_estabelecimento_observacoes"("id") ON DELETE CASCADE,
                "filename" VARCHAR NOT NULL,
                "mimetype" VARCHAR NOT NULL,
                "size" INTEGER NOT NULL,
                "data" BYTEA NOT NULL,
                "uploaded_by" VARCHAR NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_combo_estabelecimento_observacao_imagens_observacao_id" ON "combo_estabelecimento_observacao_imagens" ("observacao_id")`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "combo_equipamento_observacao_imagens"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "combo_estabelecimento_observacao_imagens"`);
    }
}
