import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateComboEstabelecimentoObservacoes1700000049000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "combo_estabelecimento_observacoes" (
                "id"         SERIAL PRIMARY KEY,
                "estab_key"  VARCHAR     NOT NULL,
                "texto"      TEXT        NOT NULL,
                "autor"      VARCHAR     NOT NULL,
                "created_at" TIMESTAMP   NOT NULL DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_combo_estabelecimento_observacoes_estab_key"
            ON "combo_estabelecimento_observacoes" ("estab_key")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "combo_estabelecimento_observacoes"`);
    }
}
