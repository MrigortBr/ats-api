import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adiciona o módulo 'empresa' (com escrita) ao role gestor_all (id=4).
 */
export class AddEmpresaToGestorAll1700000040000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, 'empresa', true
            FROM "roles" r
            WHERE r.name = 'gestor_all'
            ON CONFLICT DO NOTHING
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "role_modules"
            WHERE "role_id" = (SELECT id FROM "roles" WHERE name = 'gestor_all')
              AND "module" = 'empresa'
        `);
    }
}
