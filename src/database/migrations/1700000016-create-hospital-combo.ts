import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHospitalCombo1700000016000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "hospital_combo" (
                "id"              SERIAL PRIMARY KEY,
                "hospital_id"     INTEGER NOT NULL REFERENCES "hospital"("id") ON DELETE CASCADE,
                "combo_type"      VARCHAR NOT NULL,
                "contract"        VARCHAR,
                "delivery_parcel" VARCHAR,
                "delivery_date"   VARCHAR,
                "notes"           TEXT,
                "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at"      TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_hospital_combo_hospital_id"
            ON "hospital_combo"("hospital_id")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "hospital_combo"`);
    }
}
