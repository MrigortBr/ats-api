import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção de RTx (radioterapia) de AC, AL, AM, AP, BA, CE, DF, ES, GO e MA, dos compilados de RTx filtrados por UF.
 * Preenche as colunas rt_* de custeio_projecao (UPDATE por uf + macrorregião; AM e BA já tinham RTx e são atualizados).
 * rt: [n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, saldo]
 * Valores como vieram nas planilhas. Obs.: DF veio com 3.112 pacientes e 6.224 pessoas > 50 km, mas com 0 municípios > 50 km
 * e saldo = capacidade total (sem descontar viagens); conferir a planilha.
 */
type Dados = (number | null)[];
const ESTADOS: Record<string, { nome: string; rt: Dados }[]> = {
    CE: [
        { nome: "LITORAL LESTE JAGUARIBE", rt: [20, 741, 1482, 5928, 2, 15600, 1, 15080, 24752] },
        { nome: "SERTAO CENTRAL", rt: [20, 889, 1778, 7112, 2, 15600, 1, 15080, 23568] },
        { nome: "CARIRI", rt: [31, 1097, 2194, 8776, 2, 15600, 1, 15080, 21904] },
        { nome: "SOBRAL", rt: [51, 1863, 3726, 14904, 2, 15600, 1, 15080, 15776] },
        { nome: "FORTALEZA", rt: [31, 1432, 2864, 11456, 2, 15600, 1, 15080, 19224] },
    ],
    DF: [
        { nome: "DISTRITO FEDERAL", rt: [0, 3112, 6224, 24896, 1, 7800, 1, 15080, 22880] },
    ],
    ES: [
        { nome: "SUL", rt: [19, 345, 690, 2760, 1, 7800, 1, 15080, 20120] },
        { nome: "METROPOLITANA", rt: [20, 556, 1112, 4448, 1, 7800, 1, 15080, 18432] },
        { nome: "CENTRAL NORTE", rt: [22, 1088, 2176, 8704, 1, 7800, 1, 15080, 14176] },
    ],
    GO: [
        { nome: "MACRORREGIAO SUDOESTE", rt: [28, 638, 1276, 5104, 1, 7800, 1, 15080, 17776] },
        { nome: "MACRORREGIAO NORDESTE", rt: [31, 1698, 3396, 13584, 1, 7800, 1, 15080, 9296] },
        { nome: "MACRORREGIAO CENTRO-OESTE", rt: [63, 557, 1114, 4456, 1, 7800, 1, 15080, 18424] },
        { nome: "MACRORREGIAO CENTRO-NORTE", rt: [54, 727, 1454, 5816, 1, 7800, 1, 15080, 17064] },
        { nome: "MACRORREGIAO CENTRO SUDESTE", rt: [49, 889, 1778, 7112, 1, 7800, 1, 15080, 15768] },
    ],
    MA: [
        { nome: "MACRORREGIAO SUL", rt: [37, 747, 1494, 5976, 2, 15600, 1, 15080, 24704] },
        { nome: "MACRORREGIAO NORTE", rt: [108, 2119, 4238, 16952, 2, 15600, 1, 15080, 13728] },
        { nome: "MACRORREGIAO LESTE", rt: [61, 1252, 2504, 10016, 2, 15600, 1, 15080, 20664] },
    ],
    AC: [
        { nome: "MACRO UNICA - AC", rt: [19, 299, 598, 2392, 2, 15600, 1, 15080, 28288] },
    ],
    AL: [
        { nome: "2ª MACRORREGIAO DE SAUDE", rt: [30, 484, 968, 3872, 2, 15600, 1, 15080, 26808] },
        { nome: "1ª MACRORREGIAO DE SAUDE", rt: [47, 823, 1646, 6584, 2, 15600, 1, 15080, 24096] },
    ],
    AP: [
        { nome: "MACRO UNICA - AP", rt: [12, 127, 254, 1016, 2, 15600, 1, 15080, 29664] },
    ],
    AM: [
        { nome: "OESTE", rt: [20, 394.3668716009894, 788.7337432019788, 3154.934972807915, 2, 15600, 1, 15080, 27525.065027192086] },
        { nome: "LESTE", rt: [5, 447, 894, 3576, 2, 15600, 1, 15080, 27104] },
        { nome: "CENTRAL", rt: [9, 507, 1014, 4056, 2, 15600, 1, 15080, 26624] },
    ],
    BA: [
        { nome: "SUL (NBS - ILHEUS)", rt: [53, 1305, 2610, 10440, 2, 15600, 1, 15080, 20240] },
        { nome: "SUDOESTE (NBS - VITORIA CONQUISTA)", rt: [72, 397, 794, 3176, 3, 23400, 1, 15080, 35304] },
        { nome: "OESTE (NBS - BARREIRAS)", rt: [35, 1216, 2432, 9728, 2, 15600, 1, 15080, 20952] },
        { nome: "NORTE - (NRS - JUAZEIRO)", rt: [27, 1029, 2058, 8232, 1, 7800, 1, 15080, 14648] },
        { nome: "NORDESTE (NRS - ALAGOINHAS)", rt: [34, 135, 270, 1080, 1, 7800, 1, 15080, 21800] },
        { nome: "LESTE - (NRS - SALVADOR)", rt: [44, 67, 134, 536, 3, 23400, 1, 15080, 37944] },
        { nome: "EXTREMO SUL (NRS - TEIXEIRA FREITAS)", rt: [17, 980, 1960, 7840, 2, 15600, 1, 15080, 22840] },
        { nome: "CENTRO-LESTE (NRS - FEIRA SANTANA)", rt: [69, 134, 268, 1072, 2, 15600, 1, 15080, 29608] },
        { nome: "CENTRO - NORTE (NRS - JACOBINA)", rt: [28, 984, 1968, 7872, 2, 15600, 1, 15080, 22808] },
    ],
};

export class CusteioProjecaoRtx1700000077000 implements MigrationInterface {
    name = "CusteioProjecaoRtx1700000077000";

    async up(queryRunner: QueryRunner): Promise<void> {
        for (const [uf, macros] of Object.entries(ESTADOS)) {
            for (const m of macros) {
                await queryRunner.query(
                    `UPDATE "custeio_projecao" SET
                        "rt_n_acima50" = $3, "rt_pacientes" = $4, "rt_pessoas" = $5, "rt_viagens" = $6, "rt_vans" = $7,
                        "rt_cap_vans" = $8, "rt_micros" = $9, "rt_cap_micros" = $10, "rt_saldo" = $11
                    WHERE "uf" = $1 AND "macrorregiao" = $2`,
                    [uf, m.nome, ...m.rt],
                );
            }
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // Só remove o RTx dos estados que não tinham (AM e BA mantêm o RTx importado antes).
        for (const uf of Object.keys(ESTADOS).filter(u => u !== "AM" && u !== "BA")) {
            await queryRunner.query(
                `UPDATE "custeio_projecao" SET "rt_n_acima50" = NULL, "rt_pacientes" = NULL, "rt_pessoas" = NULL, "rt_viagens" = NULL,
                    "rt_vans" = NULL, "rt_cap_vans" = NULL, "rt_micros" = NULL, "rt_cap_micros" = NULL, "rt_saldo" = NULL WHERE "uf" = $1`,
                [uf],
            );
        }
    }
}
