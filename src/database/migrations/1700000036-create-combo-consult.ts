import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Dropa hospital_combo + combo_equipamento.
 * Cria combo_consult (flat, uma linha por equipamento).
 * Migra FK de company_problem_reports.combo_id → consult_id.
 */
export class CreateComboConsult1700000036000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Dropar tabelas antigas (CASCADE dropa FKs dependentes)
        await queryRunner.query(`DROP TABLE IF EXISTS combo_equipamento CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS hospital_combo CASCADE`);

        // 2. Criar combo_consult
        await queryRunner.query(`
            CREATE TABLE combo_consult (
                id                      SERIAL PRIMARY KEY,

                -- Chaves da planilha
                equip_key               VARCHAR UNIQUE,
                estab_key               VARCHAR,

                -- Localização
                uf_municipio            VARCHAR,
                region                  VARCHAR,
                uf                      VARCHAR(2),
                municipality            VARCHAR,
                ibge                    VARCHAR,

                -- Estabelecimento
                cnes                    VARCHAR,
                establishment_name      VARCHAR,
                cnpj                    VARCHAR,

                -- Combo
                combo_code              VARCHAR,
                combo_type              VARCHAR,
                contract                VARCHAR,
                delivery_parcel         VARCHAR,

                -- Equipamento
                equipment_name          VARCHAR,
                serial_number           VARCHAR,

                -- Datas
                expedition_date         VARCHAR,
                delivery_forecast       VARCHAR,
                delivery_date           VARCHAR,
                installation_date       VARCHAR,
                training_date           VARCHAR,

                -- Status
                delivery_status         VARCHAR,
                equipment_count         INTEGER,

                -- Nota Fiscal
                nf_sent                 BOOLEAN,
                nf_number               VARCHAR,
                nf_sent_date            VARCHAR,
                nf_value                NUMERIC(15,2),

                -- Termos de Recebimento
                provisional_receipt_sent BOOLEAN,
                final_receipt_sent       BOOLEAN,

                -- 1º Pagamento
                payment1_value          NUMERIC(15,2),
                payment1_nup            VARCHAR,
                payment1_sent_date      VARCHAR,

                -- 2º Pagamento
                payment2_value          NUMERIC(15,2),
                payment2_nup            VARCHAR,
                payment2_sent_date      VARCHAR,
                payment2_deadline       VARCHAR,

                -- Totais
                total_paid              NUMERIC(15,2),
                payment_status          VARCHAR,

                -- Contato
                notes                   TEXT,
                address                 VARCHAR,
                manager_data            VARCHAR,
                manager_phone           VARCHAR,
                focal_point_data        VARCHAR,
                focal_point_phone       VARCHAR,
                establishment_email     VARCHAR,
                focal_point_email       VARCHAR,

                -- Lock
                locked_by               VARCHAR,
                locked_at               TIMESTAMPTZ,

                -- FKs multi-tenant
                hospital_id             INTEGER REFERENCES hospital(id) ON DELETE SET NULL,
                company_id              INTEGER REFERENCES companies(id) ON DELETE SET NULL,

                -- Timestamps
                created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at              TIMESTAMPTZ,
                deleted_at              TIMESTAMPTZ
            )
        `);

        await queryRunner.query(`CREATE INDEX idx_combo_consult_estab_key  ON combo_consult (estab_key)`);
        await queryRunner.query(`CREATE INDEX idx_combo_consult_company_id ON combo_consult (company_id)`);
        await queryRunner.query(`CREATE INDEX idx_combo_consult_hospital_id ON combo_consult (hospital_id)`);
        await queryRunner.query(`CREATE INDEX idx_combo_consult_uf ON combo_consult (uf)`);

        // 3. Migrar company_problem_reports: renomear combo_id → consult_id + nova FK
        await queryRunner.query(`
            ALTER TABLE company_problem_reports
            RENAME COLUMN combo_id TO consult_id
        `);
        await queryRunner.query(`
            ALTER TABLE company_problem_reports
            ADD CONSTRAINT fk_problem_consult
            FOREIGN KEY (consult_id) REFERENCES combo_consult(id) ON DELETE SET NULL
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE company_problem_reports DROP CONSTRAINT IF EXISTS fk_problem_consult`);
        await queryRunner.query(`ALTER TABLE company_problem_reports RENAME COLUMN consult_id TO combo_id`);
        await queryRunner.query(`DROP TABLE IF EXISTS combo_consult CASCADE`);
    }
}
