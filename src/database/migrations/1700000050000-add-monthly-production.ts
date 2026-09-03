import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMonthlyProduction1700000050000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hospital_tomo" ADD COLUMN IF NOT EXISTS "monthly_production" INTEGER`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" ADD COLUMN IF NOT EXISTS "monthly_production" INTEGER`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hospital_tomo" DROP COLUMN IF EXISTS "monthly_production"`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" DROP COLUMN IF EXISTS "monthly_production"`);
    }
}
