import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adiciona role 'gestor_equipamentos' — acesso de escrita apenas aos módulos
 * de equipamentos (TOMO, RNM e Combo), sem acesso ao módulo de transporte.
 */
export class AddGestorEquipamentosRole1700000045000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "description")
            VALUES ('gestor_equipamentos', 'Gestor dos módulos de equipamentos — TOMO, RNM e Combo (sem transporte)')
            ON CONFLICT ("name") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, m.module, m.can_write
            FROM (
                VALUES
                    ('gestor_equipamentos', 'tomo',  true),
                    ('gestor_equipamentos', 'rnm',   true),
                    ('gestor_equipamentos', 'combo', true)
            ) AS m(role_name, module, can_write)
            JOIN "roles" r ON r.name = m.role_name
            ON CONFLICT DO NOTHING
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "roles" WHERE "name" = 'gestor_equipamentos'
        `);
    }
}
