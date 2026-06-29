import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHospitalCnpjIbge1700000015000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital"
            ADD COLUMN IF NOT EXISTS "cnpj"      VARCHAR,
            ADD COLUMN IF NOT EXISTS "ibge_code" VARCHAR(7)
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital"
            DROP COLUMN IF EXISTS "cnpj",
            DROP COLUMN IF EXISTS "ibge_code"
        `);
    }
}
