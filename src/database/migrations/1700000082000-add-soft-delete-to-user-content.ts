import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Preserva registros removidos pela aplicação para auditoria e eventual restauração.
 * Sessões e limpezas técnicas continuam fora deste escopo.
 */
export class AddSoftDeleteToUserContent1700000082000 implements MigrationInterface {
    name = "AddSoftDeleteToUserContent1700000082000";

    private readonly tables = [
        "hospital",
        "cib_document",
        "tomo_document",
        "rnm_document",
        "uf_fluxo_comentarios",
        "tomo_observacoes",
        "rnm_observacoes",
        "acelerador_observacoes",
        "combo_equipamento_observacoes",
        "combo_estabelecimento_observacoes",
        "tomo_observacao_imagens",
        "rnm_observacao_imagens",
        "combo_equipamento_observacao_imagens",
        "combo_estabelecimento_observacao_imagens",
        "custeio_responsavel",
        "custeio_atendido",
    ];

    async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of this.tables) {
            await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ`);
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of [...this.tables].reverse()) {
            await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "deleted_at"`);
        }
    }
}
