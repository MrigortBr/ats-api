import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Produção mensal por estabelecimento do combo (um registro por CNES + grupo de procedimentos SIGTAP).
 * `meses` guarda { "AAAAMM": [frequencia, valor] } em JSONB, para não gerar uma linha por mês.
 * Carga: npm run seed:producao-combo-grupo04.
 */
export class CreateProducaoComboMensal1700000080000 implements MigrationInterface {
    name = "CreateProducaoComboMensal1700000080000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "producao_combo_mensal" (
                "cnes" VARCHAR(7) NOT NULL,
                "grupo" VARCHAR(2) NOT NULL,
                "meses" JSONB NOT NULL DEFAULT '{}',
                "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
                PRIMARY KEY ("cnes", "grupo")
            )
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "producao_combo_mensal"`);
    }
}
