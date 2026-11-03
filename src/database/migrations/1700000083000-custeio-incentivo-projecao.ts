import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Incentivos projetados extraídos exclusivamente das abas "COMPILADO <UF>"
 * dos arquivos FINANCIAMENTO RADIOTERAPIA e FINANCIAMENTO TRS - MACRORREGIÃO.
 * RTx é o total de planejamento + tratamento; TRS é o total anual.
 */
const INCENTIVOS: Record<string, { rt?: number; hd?: number }> = {
    AC: { rt: 127640, hd: 1074216 }, AL: { rt: 265400, hd: 2900898 },
    AM: { rt: 166400, hd: 3326466 }, AP: { rt: 50240, hd: 934362 },
    BA: { rt: 3812144, hd: 19164288 }, CE: { rt: 1403044, hd: 8667516 },
    ES: { rt: 509440, hd: 2580864 }, GO: { rt: 1367200, hd: 7309302 },
    MA: { rt: 1613680, hd: 14462448 }, MG: { rt: 3230840, hd: 0 },
    MS: { rt: 666152, hd: 0 }, MT: { rt: 805332, hd: 8780772 },
    PA: { rt: 1608212, hd: 14163864 }, PB: { rt: 727080, hd: 4887168 },
    PE: { rt: 1327040, hd: 11564982 }, PI: { rt: 1013440, hd: 6553404 },
    PR: { rt: 1319600, hd: 7018440 }, RN: { rt: 470760, hd: 3817242 },
    RO: { hd: 2591160 }, RS: { rt: 1179080, hd: 4447872 },
    SC: { rt: 820320, hd: 2815098 }, SP: { rt: 1831120, hd: 5346198 },
    TO: { rt: 280120, hd: 4585152 },
};

export class CusteioIncentivoProjecao1700000083000 implements MigrationInterface {
    name = "CusteioIncentivoProjecao1700000083000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "custeio_incentivo_projecao" (
                "uf" CHAR(2) PRIMARY KEY,
                "rt_incentivo" NUMERIC(16,2),
                "hd_incentivo_anual" NUMERIC(16,2),
                "fonte" VARCHAR NOT NULL DEFAULT 'Abas COMPILADO por UF'
            )
        `);

        for (const [uf, valores] of Object.entries(INCENTIVOS)) {
            await queryRunner.query(
                `INSERT INTO "custeio_incentivo_projecao" ("uf", "rt_incentivo", "hd_incentivo_anual")
                 VALUES ($1, $2, $3)
                 ON CONFLICT ("uf") DO UPDATE SET
                    "rt_incentivo" = EXCLUDED."rt_incentivo",
                    "hd_incentivo_anual" = EXCLUDED."hd_incentivo_anual",
                    "fonte" = EXCLUDED."fonte"`,
                [uf, valores.rt ?? null, valores.hd ?? null],
            );
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "custeio_incentivo_projecao"`);
    }
}
