import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteTomoRnmCombo1700000017000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital_tomo"
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ
        `);

        await queryRunner.query(`
            ALTER TABLE "hospital_rnm"
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ
        `);

        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hospital_tomo"  DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "hospital_rnm"   DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "hospital_combo" DROP COLUMN IF EXISTS "deleted_at"`);
    }
}
