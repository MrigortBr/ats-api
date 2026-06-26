import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHospitalGestao1700000014000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital"
            ADD COLUMN IF NOT EXISTS "gestao"            VARCHAR,
            ADD COLUMN IF NOT EXISTS "natureza_juridica" VARCHAR
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital"
            DROP COLUMN IF EXISTS "gestao",
            DROP COLUMN IF EXISTS "natureza_juridica"
        `);
    }
}
