import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUfHasFluxo1700000041000 implements MigrationInterface {

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "uf"
            ADD COLUMN IF NOT EXISTS "has_fluxo" boolean NOT NULL DEFAULT false
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "uf" DROP COLUMN IF EXISTS "has_fluxo"
        `);
    }
}
