import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmpresaProblem1700000031000 implements MigrationInterface {
    async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
            CREATE TABLE company_problem_reports (
                id                  SERIAL PRIMARY KEY,
                combo_id            INTEGER NOT NULL REFERENCES hospital_combo(id) ON DELETE CASCADE,
                queixa              TEXT,
                motivo_unidade      VARCHAR,
                proposta_solucao_ms TEXT,
                status              VARCHAR,
                created_at          TIMESTAMP NOT NULL DEFAULT now(),
                updated_at          TIMESTAMP,
                deleted_at          TIMESTAMP
            )
        `);
        await qr.query(`CREATE INDEX idx_cpr_combo_id ON company_problem_reports(combo_id)`);
    }

    async down(qr: QueryRunner): Promise<void> {
        await qr.query(`DROP TABLE IF EXISTS company_problem_reports`);
    }
}
