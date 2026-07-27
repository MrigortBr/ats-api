import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUrlToUfFluxoComentarios1700000043000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uf_fluxo_comentarios" ADD COLUMN IF NOT EXISTS "url" VARCHAR DEFAULT NULL`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uf_fluxo_comentarios" DROP COLUMN IF EXISTS "url"`);
    }
}
