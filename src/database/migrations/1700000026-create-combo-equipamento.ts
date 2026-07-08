import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateComboEquipamento1700000026000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "combo_equipamento" (
                "id"                       SERIAL PRIMARY KEY,
                "combo_id"                 INTEGER NOT NULL REFERENCES "hospital_combo"("id") ON DELETE CASCADE,
                "equipment_name"           VARCHAR NOT NULL,
                "serial_number"            VARCHAR,
                "company"                  VARCHAR,
                "nf_sent"                  BOOLEAN,
                "nf_number"                VARCHAR,
                "nf_sent_date"             VARCHAR,
                "nf_value"                 NUMERIC(15, 2),
                "provisional_receipt_sent" BOOLEAN,
                "final_receipt_sent"       BOOLEAN,
                "payment1_value"           NUMERIC(15, 2),
                "payment1_nup"             VARCHAR,
                "payment1_sent_date"       VARCHAR,
                "payment2_value"           NUMERIC(15, 2),
                "payment2_nup"             VARCHAR,
                "payment2_sent_date"       VARCHAR,
                "payment2_deadline"        VARCHAR,
                "total_paid"               NUMERIC(15, 2),
                "payment_status"           VARCHAR,
                "created_at"               TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at"               TIMESTAMP DEFAULT now(),
                "deleted_at"               TIMESTAMP
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_combo_equipamento_combo_id"
            ON "combo_equipamento" ("combo_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "combo_equipamento"`);
    }
}
