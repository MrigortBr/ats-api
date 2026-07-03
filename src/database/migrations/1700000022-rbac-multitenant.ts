import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * RBAC multi-tenant migration (Part 1 — sem DROP COLUMN role legado)
 *
 * DDL:
 *   CREATE TABLE companies
 *   CREATE TABLE roles
 *   CREATE TABLE role_modules
 *   ALTER TABLE users   ADD COLUMN role_id, company_id, modules_override
 *   ALTER TABLE hospital_combo ADD COLUMN company_id
 *
 * Seed:
 *   Insere roles e role_modules
 *   Faz UPDATE users SET role_id = <id da role correspondente ao campo role legado>
 */
export class RbacMultitenant1700000022000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // ── 1. companies ──────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "companies" (
                "id"         SERIAL PRIMARY KEY,
                "name"       VARCHAR NOT NULL UNIQUE,
                "cnpj"       VARCHAR,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ,
                "deleted_at" TIMESTAMPTZ
            )
        `);

        // ── 2. roles ──────────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "roles" (
                "id"          SERIAL PRIMARY KEY,
                "name"        VARCHAR NOT NULL UNIQUE,
                "description" VARCHAR,
                "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at"  TIMESTAMPTZ
            )
        `);

        // ── 3. role_modules ───────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role_modules" (
                "id"        SERIAL PRIMARY KEY,
                "role_id"   INTEGER NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
                "module"    VARCHAR NOT NULL,
                "can_write" BOOLEAN NOT NULL DEFAULT false
            )
        `);

        // ── 4. ALTER users ────────────────────────────────────────────────────
        await queryRunner.query(`
            ALTER TABLE "users"
                ADD COLUMN IF NOT EXISTS "role_id"          INTEGER REFERENCES "roles"("id"),
                ADD COLUMN IF NOT EXISTS "company_id"       INTEGER REFERENCES "companies"("id"),
                ADD COLUMN IF NOT EXISTS "modules_override" JSONB
        `);

        // ── 5. ALTER hospital_combo ────────────────────────────────────────────
        await queryRunner.query(`
            ALTER TABLE "hospital_combo"
                ADD COLUMN IF NOT EXISTS "company_id" INTEGER REFERENCES "companies"("id")
        `);

        // ── 6. Seed roles ─────────────────────────────────────────────────────
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "description") VALUES
                ('admin',                 'Administrador do sistema'),
                ('gestor_transporte',     'Gestor do módulo de Transporte'),
                ('gestor_tomo',           'Gestor do módulo TOMO/RNM'),
                ('gestor_all',            'Gestor de todos os módulos'),
                ('fornecedor',            'Fornecedor — acesso ao módulo Combo'),
                ('visualizador_all',      'Visualizador de todos os módulos'),
                ('gestor',               'Gestor de todos os módulos menos combo')
            ON CONFLICT ("name") DO NOTHING
        `);

        // ── 7. Seed role_modules ───────────────────────────────────────────────
        await queryRunner.query(`
            INSERT INTO "role_modules" ("role_id", "module", "can_write")
            SELECT r.id, m.module, m.can_write
            FROM (
                VALUES
                    -- admin: tudo com escrita
                    ('admin',             'transporte', true ),
                    ('admin',             'tomo',       true ),
                    ('admin',             'rnm',        true ),
                    ('admin',             'combo',      true ),
                    ('admin',             'admin',      true ),
                    -- gestor_transporte
                    ('gestor_transporte', 'transporte', true ),
                    -- gestor_tomo
                    ('gestor_tomo',       'tomo',       true ),
                    ('gestor_tomo',       'rnm',        true ),
                    -- gestor_all
                    ('gestor_all',        'transporte', true ),
                    ('gestor_all',        'tomo',       true ),
                    ('gestor_all',        'rnm',        true ),
                    ('gestor_all',        'combo',      true ),
                    -- fornecedor (ex gestor_all_combo)
                    ('fornecedor',        'combo',      true ),
                    -- gestor
                    ('gestor',            'transporte', true ),
                    ('gestor',            'tomo',       true ),
                    ('gestor',            'rnm',        true ),
                    -- visualizador_all
                    ('visualizador_all',  'transporte', false),
                    ('visualizador_all',  'tomo',       false),
                    ('visualizador_all',  'rnm',        false),
                    ('visualizador_all',  'combo',      false)
            ) AS m(role_name, module, can_write)
            JOIN "roles" r ON r.name = m.role_name
            ON CONFLICT DO NOTHING
        `);

        // ── 8. Migrar dados: mapear role legada → role_id ─────────────────────
        // gestor_all_combo → fornecedor (tem acesso a combo com escrita)
        // visualizador_transporte / visualizador_tomo → visualizador_all (aproximação conservadora)
        await queryRunner.query(`
            UPDATE "users" u
            SET "role_id" = r.id
            FROM "roles" r
            WHERE r.name = CASE u.role
                WHEN 'admin'                  THEN 'admin'
                WHEN 'gestor_transporte'      THEN 'gestor_transporte'
                WHEN 'gestor_tomo'            THEN 'gestor_tomo'
                WHEN 'gestor_all'             THEN 'gestor_all'
                WHEN 'gestor_all_combo'       THEN 'fornecedor'
                WHEN 'visualizador_transporte' THEN 'visualizador_all'
                WHEN 'visualizador_tomo'      THEN 'visualizador_all'
                WHEN 'visualizador_all'       THEN 'visualizador_all'
                ELSE NULL
            END
            AND u.role_id IS NULL
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Reverter na ordem inversa (colunas antes de tabelas)
        await queryRunner.query(`ALTER TABLE "hospital_combo" DROP COLUMN IF EXISTS "company_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "modules_override"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "company_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "role_modules"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    }
}
