import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adiciona role 'gestor' — acesso de escrita em transporte, tomo e rnm.
 */
export class AddGestorRole1700000023000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "description")
            VALUES ('gestor', 'Gestor de todos os módulos menos combo')
            ON CONFLICT ("name") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, m.module, m.can_write
            FROM (
                VALUES
                    ('gestor', 'transporte', true),
                    ('gestor', 'tomo',       true),
                    ('gestor', 'rnm',        true)
            ) AS m(role_name, module, can_write)
            JOIN "roles" r ON r.name = m.role_name
            ON CONFLICT DO NOTHING
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "roles" WHERE "name" = 'gestor'
        `);
    }
}
