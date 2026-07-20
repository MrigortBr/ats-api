import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocument1700000038000 implements MigrationInterface {
    name = "CreateDocument1700000038000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE document (
                id              SERIAL PRIMARY KEY,
                original_name   VARCHAR NOT NULL,
                stored_path     VARCHAR NOT NULL,
                mime_type       VARCHAR NOT NULL,
                document_type   VARCHAR NOT NULL,
                module          VARCHAR(10) NOT NULL,
                uploaded_by     VARCHAR NOT NULL,
                file_size       INTEGER,
                consult_id      INTEGER REFERENCES combo_consult(id) ON DELETE SET NULL,
                tomo_id         INTEGER REFERENCES hospital_tomo(id) ON DELETE SET NULL,
                rnm_id          INTEGER REFERENCES hospital_rnm(id) ON DELETE SET NULL,
                uploaded_at     TIMESTAMP NOT NULL DEFAULT NOW(),
                deleted_at      TIMESTAMP
            )
        `);

        await queryRunner.query(`CREATE INDEX idx_document_consult ON document(consult_id) WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX idx_document_tomo    ON document(tomo_id)    WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX idx_document_rnm     ON document(rnm_id)     WHERE deleted_at IS NULL`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS document`);
    }
}
