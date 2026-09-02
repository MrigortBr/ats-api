import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAceleradorObservacoes1700000047000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "acelerador_observacoes" (
                "id"         SERIAL PRIMARY KEY,
                "cnes"       VARCHAR     NOT NULL,
                "texto"      TEXT        NOT NULL,
                "autor"      VARCHAR     NOT NULL,
                "created_at" TIMESTAMP   NOT NULL DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_acelerador_observacoes_cnes"
            ON "acelerador_observacoes" ("cnes")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "acelerador_observacoes"`);
    }
}
