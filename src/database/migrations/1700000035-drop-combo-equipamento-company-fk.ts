import { MigrationInterface, QueryRunner } from "typeorm";

export class DropComboEquipamentoCompanyFk1700000035000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE combo_equipamento DROP COLUMN IF EXISTS company_id
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE combo_equipamento
            ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL
        `);
    }
}
