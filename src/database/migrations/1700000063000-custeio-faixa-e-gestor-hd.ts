import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Custeio do transporte: suporte às planilhas de outras UFs.
 * - Distância pode vir só como FAIXA (faixa_rt/faixa_hd) → dist_rt/dist_hd passam a aceitar nulo.
 * - Pacientes de RT aceitam meio paciente (a planilha traz o dobro, com acompanhantes).
 * - Gestor/veículo de hemodiálise distintos do de radioterapia (gestor_hd, tipo_veiculo_hd), usados só na exceção.
 * - Tipo de veículo, nº de veículos e referências nem sempre são informados → nulos.
 */
export class CusteioFaixaEGestorHd1700000063000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" ADD COLUMN IF NOT EXISTS "gestor_hd" VARCHAR`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" ADD COLUMN IF NOT EXISTS "tipo_veiculo_hd" VARCHAR`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" ALTER COLUMN "tipo_veiculo" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" ALTER COLUMN "n_veiculos" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" ALTER COLUMN "n_veiculos" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" ALTER COLUMN "ref_rt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" ALTER COLUMN "ref_hd" DROP NOT NULL`);

        await queryRunner.query(`ALTER TABLE "custeio_atendido" ADD COLUMN IF NOT EXISTS "faixa_rt" VARCHAR`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ADD COLUMN IF NOT EXISTS "faixa_hd" VARCHAR`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_rt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_rt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_hd" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_hd" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "rt" TYPE NUMERIC(9,1) USING "rt"::numeric`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "custeio_atendido" SET "dist_rt" = 0 WHERE "dist_rt" IS NULL`);
        await queryRunner.query(`UPDATE "custeio_atendido" SET "dist_hd" = 0 WHERE "dist_hd" IS NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "rt" TYPE INTEGER USING round("rt")::integer`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_rt" SET DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_rt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_hd" SET DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" ALTER COLUMN "dist_hd" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" DROP COLUMN IF EXISTS "faixa_hd"`);
        await queryRunner.query(`ALTER TABLE "custeio_atendido" DROP COLUMN IF EXISTS "faixa_rt"`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" DROP COLUMN IF EXISTS "tipo_veiculo_hd"`);
        await queryRunner.query(`ALTER TABLE "custeio_responsavel" DROP COLUMN IF EXISTS "gestor_hd"`);
    }
}
