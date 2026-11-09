import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Entregue por município na Cota Geral (a tabela só guardava a meta).
 * Fonte: planilha "Entregas por tipo, cota e município" (PACnorama).
 */
export class AddEntregueCotaGeralMunicipio1700000085000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cota_geral_municipio"
                ADD COLUMN IF NOT EXISTS "entregue_ambulancia" INTEGER NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "entregue_microonibus" INTEGER NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "entregue_van" INTEGER NOT NULL DEFAULT 0
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cota_geral_municipio"
                DROP COLUMN IF EXISTS "entregue_ambulancia",
                DROP COLUMN IF EXISTS "entregue_microonibus",
                DROP COLUMN IF EXISTS "entregue_van"
        `);
    }
}
