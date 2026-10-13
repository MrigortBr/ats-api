import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Marca o deslocamento interestadual: UF da cidade de referência por município atendido
 * (nulo = mesma UF do custeio). Preenche a partir do sufixo "/UF" das referências já cadastradas.
 */
export class CusteioRefUf1700000066000 implements MigrationInterface {
    name = "CusteioRefUf1700000066000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ADD COLUMN IF NOT EXISTS "ref_uf" CHAR(2)`);
        await queryRunner.query(`
            UPDATE "custeio_atendido" a
               SET "ref_uf" = x.sigla
              FROM (
                    SELECT r."id" AS rid,
                           upper(substring(coalesce(r."ref_rt", r."ref_hd") from '/\\s*([A-Za-z]{2})\\s*$')) AS sigla,
                           r."uf" AS uf
                      FROM "custeio_responsavel" r
                   ) x
             WHERE a."responsavel_id" = x.rid
               AND x.sigla IS NOT NULL
               AND x.sigla <> x.uf
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custeio_atendido" DROP COLUMN IF EXISTS "ref_uf"`);
    }
}
