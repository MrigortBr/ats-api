import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUfFluxoComentarios1700000042000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "uf_fluxo_comentarios" (
                "id"         SERIAL PRIMARY KEY,
                "uf_id"      INTEGER     NOT NULL REFERENCES "uf"("id") ON DELETE CASCADE,
                "texto"      TEXT        NOT NULL,
                "autor"      VARCHAR     NOT NULL,
                "created_at" TIMESTAMP   NOT NULL DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_uf_fluxo_comentarios_uf_id"
            ON "uf_fluxo_comentarios" ("uf_id")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "uf_fluxo_comentarios"`);
    }
}
