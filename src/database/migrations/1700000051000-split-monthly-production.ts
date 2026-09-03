import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitMonthlyProduction1700000051000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // Substitui o campo único "monthly_production" por dois campos (antes / a partir),
        // usados pra calcular a variação percentual (Δ%) no frontend.
        await queryRunner.query(`ALTER TABLE "hospital_tomo" DROP COLUMN IF EXISTS "monthly_production"`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" DROP COLUMN IF EXISTS "monthly_production"`);

        await queryRunner.query(`ALTER TABLE "hospital_tomo" ADD COLUMN IF NOT EXISTS "monthly_production_before" INTEGER`);
        await queryRunner.query(`ALTER TABLE "hospital_tomo" ADD COLUMN IF NOT EXISTS "monthly_production_after" INTEGER`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" ADD COLUMN IF NOT EXISTS "monthly_production_before" INTEGER`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" ADD COLUMN IF NOT EXISTS "monthly_production_after" INTEGER`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hospital_tomo" DROP COLUMN IF EXISTS "monthly_production_before"`);
        await queryRunner.query(`ALTER TABLE "hospital_tomo" DROP COLUMN IF EXISTS "monthly_production_after"`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" DROP COLUMN IF EXISTS "monthly_production_before"`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" DROP COLUMN IF EXISTS "monthly_production_after"`);

        await queryRunner.query(`ALTER TABLE "hospital_tomo" ADD COLUMN IF NOT EXISTS "monthly_production" INTEGER`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm" ADD COLUMN IF NOT EXISTS "monthly_production" INTEGER`);
    }
}
