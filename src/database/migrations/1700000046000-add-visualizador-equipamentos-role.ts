import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adiciona role 'visualizador_equipamentos' — acesso somente leitura aos
 * módulos de equipamentos (TOMO, RNM e Combo), sem acesso ao módulo de
 * transporte.
 */
export class AddVisualizadorEquipamentosRole1700000046000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "description")
            VALUES ('visualizador_equipamentos', 'Visualizador dos módulos de equipamentos — TOMO, RNM e Combo (somente leitura, sem transporte)')
            ON CONFLICT ("name") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, m.module, m.can_write
            FROM (
                VALUES
                    ('visualizador_equipamentos', 'tomo',  false),
                    ('visualizador_equipamentos', 'rnm',   false),
                    ('visualizador_equipamentos', 'combo', false)
            ) AS m(role_name, module, can_write)
            JOIN "roles" r ON r.name = m.role_name
            ON CONFLICT DO NOTHING
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "roles" WHERE "name" = 'visualizador_equipamentos'
        `);
    }
}
