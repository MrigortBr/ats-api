import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Divide o role genérico em 4 roles de visualizador específicos:
 *   visualizador_transporte — transporte (leitura)
 *   visualizador_tomo       — tomo + rnm (leitura)
 *   visualizador_combo      — transporte + tomo + rnm + combo (leitura)
 *   visualizador_all        — transporte + tomo + rnm, SEM combo (ajuste do seed anterior)
 */
export class SplitVisualizadorRoles1700000025000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insere os 3 novos roles
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "description") VALUES
                ('visualizador_transporte', 'Visualizador do módulo de Transporte'),
                ('visualizador_tomo',       'Visualizador dos módulos TOMO e RNM'),
                ('visualizador_combo',      'Visualizador de todos os módulos incluindo Combo')
            ON CONFLICT ("name") DO NOTHING
        `);

        // 2. Seed de módulos para os novos roles
        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, m.module, false
            FROM (
                VALUES
                    ('visualizador_transporte', 'transporte'),
                    ('visualizador_tomo',       'tomo'),
                    ('visualizador_tomo',       'rnm'),
                    ('visualizador_combo',      'transporte'),
                    ('visualizador_combo',      'tomo'),
                    ('visualizador_combo',      'rnm'),
                    ('visualizador_combo',      'combo')
            ) AS m(role_name, module)
            JOIN "roles" r ON r.name = m.role_name
            ON CONFLICT DO NOTHING
        `);

        // 3. Remove o módulo 'combo' do visualizador_all (deve ver tudo MENOS combo)
        await queryRunner.query(`
            DELETE FROM "role_modules"
            WHERE "role_id" = (SELECT id FROM "roles" WHERE name = 'visualizador_all')
              AND "module" = 'combo'
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Restaura combo no visualizador_all
        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, 'combo', false FROM "roles" r WHERE r.name = 'visualizador_all'
            ON CONFLICT DO NOTHING
        `);

        // Remove os novos roles (CASCADE limpa role_modules)
        await queryRunner.query(`
            DELETE FROM "roles"
            WHERE "name" IN ('visualizador_transporte', 'visualizador_tomo', 'visualizador_combo')
        `);
    }
}
