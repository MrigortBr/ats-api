import { MigrationInterface, QueryRunner } from "typeorm";

export class AddComboFields1700000021000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
                ADD COLUMN IF NOT EXISTS "expedition_date"   VARCHAR,
                ADD COLUMN IF NOT EXISTS "delivery_forecast" VARCHAR,
                ADD COLUMN IF NOT EXISTS "installation_date" VARCHAR,
                ADD COLUMN IF NOT EXISTS "training_date"     VARCHAR,
                ADD COLUMN IF NOT EXISTS "delivery_status"   VARCHAR,
                ADD COLUMN IF NOT EXISTS "equipment_count"   INTEGER,
                ADD COLUMN IF NOT EXISTS "address"           VARCHAR,
                ADD COLUMN IF NOT EXISTS "manager_data"      VARCHAR,
                ADD COLUMN IF NOT EXISTS "manager_phone"     VARCHAR,
                ADD COLUMN IF NOT EXISTS "focal_point_data"  VARCHAR,
                ADD COLUMN IF NOT EXISTS "focal_point_phone" VARCHAR,
                ADD COLUMN IF NOT EXISTS "focal_point_email" VARCHAR
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
                DROP COLUMN IF EXISTS "expedition_date",
                DROP COLUMN IF EXISTS "delivery_forecast",
                DROP COLUMN IF EXISTS "installation_date",
                DROP COLUMN IF EXISTS "training_date",
                DROP COLUMN IF EXISTS "delivery_status",
                DROP COLUMN IF EXISTS "equipment_count",
                DROP COLUMN IF EXISTS "address",
                DROP COLUMN IF EXISTS "manager_data",
                DROP COLUMN IF EXISTS "manager_phone",
                DROP COLUMN IF EXISTS "focal_point_data",
                DROP COLUMN IF EXISTS "focal_point_phone",
                DROP COLUMN IF EXISTS "focal_point_email"
        `);
    }
}
