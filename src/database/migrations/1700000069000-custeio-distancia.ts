import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Cálculo de distância por estrada (Nominatim + OSRM):
 *  - coordenadas dos municípios (preenchidas sob demanda e guardadas);
 *  - cache de distâncias por par de municípios;
 *  - novos rótulos das faixas (até 50 km não paga; paga a partir de 51 km): "< 50 km" -> "Até 50 km",
 *    RT "50 - 200" -> "51 - 200". Atualiza as faixas já guardadas.
 */
export class CusteioDistancia1700000069000 implements MigrationInterface {
    name = "CusteioDistancia1700000069000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custeio_municipio_ref" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION`);
        await queryRunner.query(`ALTER TABLE "custeio_municipio_ref" ADD COLUMN IF NOT EXISTS "lon" DOUBLE PRECISION`);
        await queryRunner.query(`ALTER TABLE "custeio_municipio_ref" ADD COLUMN IF NOT EXISTS "geocodificado_em" TIMESTAMPTZ`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "custeio_distancia_cache" (
                "origem_ibge" INTEGER NOT NULL,
                "destino_ibge" INTEGER NOT NULL,
                "km" NUMERIC(9,2) NOT NULL,
                "calculado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY ("origem_ibge", "destino_ibge")
            )
        `);

        await queryRunner.query(`UPDATE "custeio_atendido" SET "faixa_rt" = 'Até 50 km' WHERE "faixa_rt" = '< 50 km'`);
        await queryRunner.query(`UPDATE "custeio_atendido" SET "faixa_rt" = '51 - 200' WHERE "faixa_rt" = '50 - 200'`);
        await queryRunner.query(`UPDATE "custeio_atendido" SET "faixa_hd" = 'Até 50 km' WHERE "faixa_hd" = '< 50 km'`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "custeio_atendido" SET "faixa_hd" = '< 50 km' WHERE "faixa_hd" = 'Até 50 km'`);
        await queryRunner.query(`UPDATE "custeio_atendido" SET "faixa_rt" = '50 - 200' WHERE "faixa_rt" = '51 - 200'`);
        await queryRunner.query(`UPDATE "custeio_atendido" SET "faixa_rt" = '< 50 km' WHERE "faixa_rt" = 'Até 50 km'`);
        await queryRunner.query(`DROP TABLE IF EXISTS "custeio_distancia_cache"`);
        await queryRunner.query(`ALTER TABLE "custeio_municipio_ref" DROP COLUMN IF EXISTS "geocodificado_em"`);
        await queryRunner.query(`ALTER TABLE "custeio_municipio_ref" DROP COLUMN IF EXISTS "lon"`);
        await queryRunner.query(`ALTER TABLE "custeio_municipio_ref" DROP COLUMN IF EXISTS "lat"`);
    }
}
