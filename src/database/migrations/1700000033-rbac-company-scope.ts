import { MigrationInterface, QueryRunner } from "typeorm";

export class RbacCompanyScope1700000033000 implements MigrationInterface {
    name = "RbacCompanyScope1700000033000";

    public async up(runner: QueryRunner): Promise<void> {
        // 1. Scope de empresa em role_modules
        await runner.query(`
            ALTER TABLE role_modules
            ADD COLUMN IF NOT EXISTS company_id INTEGER NULL
                REFERENCES companies(id) ON DELETE SET NULL
        `);

        // 2. Nome fantasia em companies
        await runner.query(`
            ALTER TABLE companies
            ADD COLUMN IF NOT EXISTS trade_name VARCHAR NULL
        `);
    }

    public async down(runner: QueryRunner): Promise<void> {
        await runner.query(`ALTER TABLE role_modules DROP COLUMN IF EXISTS company_id`);
        await runner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS trade_name`);
    }
}
