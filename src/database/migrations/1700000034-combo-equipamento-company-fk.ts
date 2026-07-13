import { MigrationInterface, QueryRunner } from "typeorm";

export class ComboEquipamentoCompanyFk1700000034000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Adiciona FK company_id em combo_equipamento
        await queryRunner.query(`
            ALTER TABLE combo_equipamento
            ADD COLUMN IF NOT EXISTS company_id INTEGER
                REFERENCES companies(id) ON DELETE SET NULL
        `);

        // 2. Backfill: popula company_id a partir do campo company (texto)
        await queryRunner.query(`
            UPDATE combo_equipamento ce
            SET company_id = c.id
            FROM companies c
            WHERE UPPER(TRIM(ce.company)) = UPPER(TRIM(c.name))
              AND c.deleted_at IS NULL
        `);

        // 3. Remove o campo texto (agora substituído pelo FK)
        await queryRunner.query(`
            ALTER TABLE combo_equipamento DROP COLUMN IF EXISTS company
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE combo_equipamento ADD COLUMN IF NOT EXISTS company VARCHAR
        `);
        await queryRunner.query(`
            UPDATE combo_equipamento ce
            SET company = c.name
            FROM companies c
            WHERE c.id = ce.company_id
        `);
        await queryRunner.query(`
            ALTER TABLE combo_equipamento DROP COLUMN IF EXISTS company_id
        `);
    }
}
