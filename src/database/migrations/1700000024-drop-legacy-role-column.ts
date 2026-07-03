import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Remove a coluna legada `role` da tabela users.
 * Pré-requisito: migration 022 (rbac-multitenant) já rodada e todos os
 * usuários mapeados para role_id.
 */
export class DropLegacyRoleColumn1700000024000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN IF EXISTS "role"
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
                ADD COLUMN IF NOT EXISTS "role" VARCHAR DEFAULT 'visualizador_transporte'
        `);
    }
}
