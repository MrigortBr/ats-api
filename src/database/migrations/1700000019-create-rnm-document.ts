import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRnmDocument1700000019000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "rnm_document" (
                "id"            SERIAL PRIMARY KEY,
                "hospital_id"   INTEGER NOT NULL REFERENCES "hospital"("id") ON DELETE CASCADE,
                "filename"      VARCHAR NOT NULL,
                "mimetype"      VARCHAR NOT NULL,
                "size"          INTEGER NOT NULL,
                "data"          BYTEA NOT NULL,
                "uploaded_by"   VARCHAR NOT NULL,
                "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_rnm_document_hospital_id" ON "rnm_document"("hospital_id")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "rnm_document"`);
    }
}
