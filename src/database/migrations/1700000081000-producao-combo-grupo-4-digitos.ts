import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * producao_combo_mensal.grupo passa de VARCHAR(2) para VARCHAR(4): a produção do combo oftalmo
 * é do subgrupo SIGTAP 0405 (cirurgias oftalmológicas), não do grupo 04 inteiro.
 * Carga: npm run seed:producao-combo-0405.
 */
export class ProducaoComboGrupo4Digitos1700000081000 implements MigrationInterface {
    name = "ProducaoComboGrupo4Digitos1700000081000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "producao_combo_mensal" ALTER COLUMN "grupo" TYPE VARCHAR(4)`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Códigos de 4 dígitos não cabem em VARCHAR(2): saem antes de encolher a coluna (a carga é refeita pelo seed).
        await queryRunner.query(`DELETE FROM "producao_combo_mensal" WHERE length("grupo") > 2`);
        await queryRunner.query(`ALTER TABLE "producao_combo_mensal" ALTER COLUMN "grupo" TYPE VARCHAR(2)`);
    }
}
