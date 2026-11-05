import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAceleradorSincronizacao1700000084000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "acelerador_sincronizacao" (
                "id" SERIAL PRIMARY KEY,
                "fonte" VARCHAR NOT NULL DEFAULT 'SIMDASH',
                "gerado_em_fonte" TIMESTAMPTZ NULL,
                "total_recebido" INTEGER NOT NULL,
                "cobertura" JSONB NULL,
                "sincronizado_em" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "acelerador_simdash_registro" (
                "id" SERIAL PRIMARY KEY,
                "cnes" VARCHAR NOT NULL,
                "dados" JSONB NOT NULL,
                "sincronizacao_id" INTEGER NOT NULL REFERENCES "acelerador_sincronizacao"("id") ON DELETE RESTRICT,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "uq_acelerador_simdash_registro_cnes" UNIQUE ("cnes")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_acelerador_simdash_registro_sync" ON "acelerador_simdash_registro" ("sincronizacao_id")`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "acelerador_simdash_registro"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "acelerador_sincronizacao"`);
    }
}
