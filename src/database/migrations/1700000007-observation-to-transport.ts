import { MigrationInterface, QueryRunner } from "typeorm";

export class ObservationToTransport1700000007000 implements MigrationInterface {
    async up(runner: QueryRunner): Promise<void> {
        await runner.query(`ALTER TABLE transport_rtx ADD COLUMN IF NOT EXISTS observation VARCHAR NULL`);
        await runner.query(`ALTER TABLE transport_trs ADD COLUMN IF NOT EXISTS observation VARCHAR NULL`);
        await runner.query(`ALTER TABLE uf DROP COLUMN IF EXISTS observation`);
    }

    async down(runner: QueryRunner): Promise<void> {
        await runner.query(`ALTER TABLE uf ADD COLUMN IF NOT EXISTS observation VARCHAR NULL`);
        await runner.query(`ALTER TABLE transport_rtx DROP COLUMN IF EXISTS observation`);
        await runner.query(`ALTER TABLE transport_trs DROP COLUMN IF EXISTS observation`);
    }
}
