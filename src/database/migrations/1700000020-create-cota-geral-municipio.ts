import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCotaGeralMunicipio1700000020000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cota_geral_municipio" (
                "id"               SERIAL PRIMARY KEY,
                "ibge"             VARCHAR(7)   NOT NULL,
                "uf"               VARCHAR(2)   NOT NULL,
                "nome_municipio"   VARCHAR      NOT NULL,
                "ente_beneficiario" VARCHAR     NOT NULL DEFAULT 'Município',
                "finalidade"       VARCHAR      NOT NULL DEFAULT 'Geral',
                "ambulancia"       INTEGER      NOT NULL DEFAULT 0,
                "microonibus"      INTEGER      NOT NULL DEFAULT 0,
                "van"              INTEGER      NOT NULL DEFAULT 0
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_cota_geral_municipio_uf"
            ON "cota_geral_municipio" ("uf")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "cota_geral_municipio"`);
    }
}
