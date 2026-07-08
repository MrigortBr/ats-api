import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyAbbreviation1700000032000 implements MigrationInterface {
    async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
            ALTER TABLE companies
            ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(20)
        `);
    }

    async down(qr: QueryRunner): Promise<void> {
        await qr.query(`ALTER TABLE companies DROP COLUMN IF EXISTS abbreviation`);
    }
}
