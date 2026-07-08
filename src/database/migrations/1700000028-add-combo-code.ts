import { MigrationInterface, QueryRunner } from "typeorm";

export class AddComboCode1700000028000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "combo_equipamento"
                ADD COLUMN IF NOT EXISTS "combo_code" VARCHAR
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "combo_equipamento"
                DROP COLUMN IF EXISTS "combo_code"
        `);
    }
}
