import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCibMunicipio1700000044000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cib_municipio" (
                "id"                SERIAL PRIMARY KEY,
                "ibge"              VARCHAR(7)   DEFAULT NULL,
                "uf"                VARCHAR(2)   NOT NULL,
                "nome_municipio"    VARCHAR      NOT NULL,
                "regiao_saude"      VARCHAR      DEFAULT NULL,
                "radioterapia"      BOOLEAN      NOT NULL DEFAULT false,
                "trs_hemodialise"   BOOLEAN      NOT NULL DEFAULT false,
                "veiculos"          VARCHAR      DEFAULT NULL,
                "resolucao_ref"     VARCHAR      DEFAULT NULL,
                "created_at"        TIMESTAMP    NOT NULL DEFAULT now(),
                "updated_at"        TIMESTAMP    NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_cib_municipio_uf"
            ON "cib_municipio" ("uf")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "cib_municipio"`);
    }
}
