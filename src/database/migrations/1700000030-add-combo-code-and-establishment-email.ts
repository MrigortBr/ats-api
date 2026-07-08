import { MigrationInterface, QueryRunner } from "typeorm";

export class AddComboCodeAndEstablishmentEmail1700000030000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "combo_equipamento"
                ADD COLUMN IF NOT EXISTS "combo_code" VARCHAR
        `);
        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
                ADD COLUMN IF NOT EXISTS "establishment_email" VARCHAR
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "combo_equipamento"
                DROP COLUMN IF EXISTS "combo_code"
        `);
        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
                DROP COLUMN IF EXISTS "establishment_email"
        `);
    }
}
