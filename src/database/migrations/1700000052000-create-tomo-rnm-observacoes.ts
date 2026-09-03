import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTomoRnmObservacoes1700000052000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // ── TOMO ─────────────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tomo_observacoes" (
                "id" SERIAL PRIMARY KEY,
                "hospital_id" INTEGER NOT NULL,
                "texto" TEXT NOT NULL,
                "autor" VARCHAR NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tomo_observacoes_hospital_id" ON "tomo_observacoes" ("hospital_id")`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tomo_observacao_imagens" (
                "id" SERIAL PRIMARY KEY,
                "observacao_id" INTEGER NOT NULL REFERENCES "tomo_observacoes"("id") ON DELETE CASCADE,
                "filename" VARCHAR NOT NULL,
                "mimetype" VARCHAR NOT NULL,
                "size" INTEGER NOT NULL,
                "data" BYTEA NOT NULL,
                "uploaded_by" VARCHAR NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tomo_observacao_imagens_observacao_id" ON "tomo_observacao_imagens" ("observacao_id")`);

        // ── RNM ──────────────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "rnm_observacoes" (
                "id" SERIAL PRIMARY KEY,
                "hospital_id" INTEGER NOT NULL,
                "texto" TEXT NOT NULL,
                "autor" VARCHAR NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_rnm_observacoes_hospital_id" ON "rnm_observacoes" ("hospital_id")`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "rnm_observacao_imagens" (
                "id" SERIAL PRIMARY KEY,
                "observacao_id" INTEGER NOT NULL REFERENCES "rnm_observacoes"("id") ON DELETE CASCADE,
                "filename" VARCHAR NOT NULL,
                "mimetype" VARCHAR NOT NULL,
                "size" INTEGER NOT NULL,
                "data" BYTEA NOT NULL,
                "uploaded_by" VARCHAR NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_rnm_observacao_imagens_observacao_id" ON "rnm_observacao_imagens" ("observacao_id")`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "tomo_observacao_imagens"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tomo_observacoes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "rnm_observacao_imagens"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "rnm_observacoes"`);
    }
}
