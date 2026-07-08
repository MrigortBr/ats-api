import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHospitalComboEstablishment1700000029000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
                ADD COLUMN IF NOT EXISTS "establishment_email" VARCHAR
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
                DROP COLUMN IF EXISTS "establishment_email"
        `);
    }
}
