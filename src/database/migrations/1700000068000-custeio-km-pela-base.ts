import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Preenche o km (RT e HD) das linhas de custeio que só tinham a faixa, usando a base de municípios
 * (custeio_municipio_ref), e passa a derivar a faixa do km (faixa_rt/faixa_hd viram nulas nessas linhas).
 * Atenção: os valores em R$ dessas linhas mudam; revalidar depois de rodar.
 * Linhas que já tinham km, e municípios sem km na base (ex.: acesso fluvial), ficam como estavam.
 * Guarda o estado anterior em custeio_atendido_bkp_68000 para o down.
 */
function chave(nome: string): string {
    return nome
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase().replace(/\s+/g, " ").trim();
}

function semParenteses(nome: string): string {
    return nome.replace(/\s*\(.*\)\s*$/, "");
}

interface Linha {
    id: number;
    nome: string;
    uf: string;
    dist_rt: string | null;
    dist_hd: string | null;
    faixa_rt: string | null;
    faixa_hd: string | null;
}

interface Ref {
    uf: string;
    municipio: string;
    dist_rt: number | null;
    dist_hd: number | null;
}

export class CusteioKmPelaBase1700000068000 implements MigrationInterface {
    name = "CusteioKmPelaBase1700000068000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "custeio_atendido_bkp_68000" (
                "id" INTEGER PRIMARY KEY,
                "dist_rt" NUMERIC(9,2),
                "dist_hd" NUMERIC(9,2),
                "faixa_rt" VARCHAR,
                "faixa_hd" VARCHAR
            )
        `);

        const refs: Ref[] = await queryRunner.query(`SELECT "uf", "municipio", "dist_rt", "dist_hd" FROM "custeio_municipio_ref"`);
        const porNome = new Map<string, Ref>();
        for (const r of refs) porNome.set(`${r.uf}|${chave(r.municipio)}`, r);

        const linhas: Linha[] = await queryRunner.query(`
            SELECT a."id", a."nome", r."uf", a."dist_rt", a."dist_hd", a."faixa_rt", a."faixa_hd"
              FROM "custeio_atendido" a
              JOIN "custeio_responsavel" r ON r."id" = a."responsavel_id"
             WHERE a."dist_rt" IS NULL OR a."dist_hd" IS NULL
        `);

        let alteradas = 0;
        for (const l of linhas) {
            const ref = porNome.get(`${l.uf}|${chave(l.nome)}`) ?? porNome.get(`${l.uf}|${chave(semParenteses(l.nome))}`);
            if (!ref) continue;
            const novoRt = l.dist_rt === null && ref.dist_rt !== null ? ref.dist_rt : null;
            const novoHd = l.dist_hd === null && ref.dist_hd !== null ? ref.dist_hd : null;
            if (novoRt === null && novoHd === null) continue;

            await queryRunner.query(
                `INSERT INTO "custeio_atendido_bkp_68000" ("id","dist_rt","dist_hd","faixa_rt","faixa_hd")
                 VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("id") DO NOTHING`,
                [l.id, l.dist_rt, l.dist_hd, l.faixa_rt, l.faixa_hd],
            );
            await queryRunner.query(
                `UPDATE "custeio_atendido" SET
                    "dist_rt" = COALESCE($2::numeric, "dist_rt"),
                    "faixa_rt" = CASE WHEN $2::numeric IS NOT NULL THEN NULL ELSE "faixa_rt" END,
                    "dist_hd" = COALESCE($3::numeric, "dist_hd"),
                    "faixa_hd" = CASE WHEN $3::numeric IS NOT NULL THEN NULL ELSE "faixa_hd" END
                  WHERE "id" = $1`,
                [l.id, novoRt, novoHd],
            );
            alteradas++;
        }
        console.log(`[custeio-km-pela-base] ${alteradas} de ${linhas.length} linhas atualizadas`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "custeio_atendido" a
               SET "dist_rt" = b."dist_rt", "dist_hd" = b."dist_hd", "faixa_rt" = b."faixa_rt", "faixa_hd" = b."faixa_hd"
              FROM "custeio_atendido_bkp_68000" b
             WHERE a."id" = b."id"
        `);
        await queryRunner.query(`DROP TABLE IF EXISTS "custeio_atendido_bkp_68000"`);
    }
}
