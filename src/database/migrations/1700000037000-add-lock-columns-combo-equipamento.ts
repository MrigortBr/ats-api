import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLockColumnsComboEquipamento1700000037000 implements MigrationInterface {
    name = "AddLockColumnsComboEquipamento1700000037000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "combo_consult"
            ADD COLUMN IF NOT EXISTS "locked_by" VARCHAR,
            ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMPTZ
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "combo_consult" DROP COLUMN IF EXISTS "locked_at"`);
        await queryRunner.query(`ALTER TABLE "combo_consult" DROP COLUMN IF EXISTS "locked_by"`);
    }
}
