import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adiciona role 'gestor_transporte_equipamentos' — acesso de escrita aos
 * módulos de Transporte e Equipamentos (TOMO, RNM e Combo), sem acesso ao
 * módulo de empresa.
 */
export class AddGestorTransporteEquipamentosRole1700000057000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "description")
            VALUES ('gestor_transporte_equipamentos', 'Gestor dos módulos de Transporte e Equipamentos — Transporte, TOMO, RNM e Combo (sem empresa)')
            ON CONFLICT ("name") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, m.module, m.can_write
            FROM (
                VALUES
                    ('gestor_transporte_equipamentos', 'transporte', true),
                    ('gestor_transporte_equipamentos', 'tomo',       true),
                    ('gestor_transporte_equipamentos', 'rnm',        true),
                    ('gestor_transporte_equipamentos', 'combo',      true)
            ) AS m(role_name, module, can_write)
            JOIN "roles" r ON r.name = m.role_name
            ON CONFLICT DO NOTHING
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "roles" WHERE "name" = 'gestor_transporte_equipamentos'
        `);
    }
}
