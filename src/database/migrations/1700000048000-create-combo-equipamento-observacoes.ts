import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateComboEquipamentoObservacoes1700000048000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "combo_equipamento_observacoes" (
                "id"         SERIAL PRIMARY KEY,
                "equip_key"  VARCHAR     NOT NULL,
                "texto"      TEXT        NOT NULL,
                "autor"      VARCHAR     NOT NULL,
                "created_at" TIMESTAMP   NOT NULL DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_combo_equipamento_observacoes_equip_key"
            ON "combo_equipamento_observacoes" ("equip_key")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "combo_equipamento_observacoes"`);
    }
}
