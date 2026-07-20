import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTomoDocument1700000039000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS tomo_document (
                id          SERIAL PRIMARY KEY,
                hospital_id INTEGER NOT NULL REFERENCES hospital(id) ON DELETE CASCADE,
                filename    VARCHAR NOT NULL,
                mimetype    VARCHAR NOT NULL,
                size        INTEGER NOT NULL,
                data        BYTEA   NOT NULL,
                uploaded_by VARCHAR NOT NULL,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            CREATE INDEX idx_tomo_document_hospital ON tomo_document(hospital_id);
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS tomo_document;`);
    }
}
