import { MigrationInterface, QueryRunner } from "typeorm";

const UF_REGIONS: Record<string, string> = {
    AC: "Norte", AM: "Norte", AP: "Norte", PA: "Norte",
    RO: "Norte", RR: "Norte", TO: "Norte",
    AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste",
    PB: "Nordeste", PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",
    DF: "Centro-Oeste", GO: "Centro-Oeste", MS: "Centro-Oeste", MT: "Centro-Oeste",
    ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste",
    PR: "Sul", RS: "Sul", SC: "Sul",
};

export class AddUfRegion1700000027000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "uf" ADD COLUMN IF NOT EXISTS "region" VARCHAR
        `);

        for (const [uf, region] of Object.entries(UF_REGIONS)) {
            await queryRunner.query(
                `UPDATE "uf" SET "region" = $1 WHERE "uf" = $2`,
                [region, uf],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uf" DROP COLUMN IF EXISTS "region"`);
    }
}
