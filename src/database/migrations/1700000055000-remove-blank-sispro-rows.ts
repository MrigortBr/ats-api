import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * A seed inicial de 1700000054000 incluía 9 linhas do SISPRO que na planilha original
 * só tinham a coluna "Equipamento" preenchida (linhas em branco no fim da aba) — não
 * representam uma alocação real. Essas linhas foram removidas do seed, mas quem já
 * rodou a migration anterior ficou com elas no banco. Esta migration limpa esse resíduo.
 */
export class RemoveBlankSisproRows1700000055000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "equipamento_convenio_sispro"
            WHERE "pendente" = true
              AND "regiao" IS NULL
              AND "uf" IS NULL
              AND "municipio" IS NULL
              AND "entidade" IS NULL
              AND "nu_proposta" IS NULL
              AND "nu_processo" IS NULL
              AND "convenio" IS NULL
              AND "ano" IS NULL
        `);
    }

    async down(): Promise<void> {
        // Irreversível de propósito — não faz sentido re-inserir linhas em branco.
    }
}
