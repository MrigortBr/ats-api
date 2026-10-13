import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção de RTx (radioterapia) de MG, MS, MT, PA, PB, PE, PI, PR, RJ e RN, dos compilados de RTx filtrados por UF.
 * Preenche as colunas rt_* de custeio_projecao (UPDATE por uf + macrorregião; PR já tinha RTx e é atualizado).
 * rt: [n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, saldo]
 * Valores como vieram nas planilhas.
 */
type Dados = (number | null)[];
const ESTADOS: Record<string, { nome: string; rt: Dados }[]> = {
    PB: [
        { nome: "MACRORREGIAO III - SERTAO ALTO SERTAO", rt: [89, 1287, 2574, 10296, 2, 15600, 1, 15080, 20384] },
        { nome: "MACRORREGIAO II - CAMPINA GRANDE", rt: [44, 473, 946, 3784, 2, 15600, 1, 15080, 26896] },
        { nome: "MACRORREGIAO I - JOAO PESSOA", rt: [42, 705, 1410, 5640, 2, 15600, 1, 15080, 25040] },
    ],
    PR: [
        { nome: "MACRORREGIONAL NORTE", rt: [62, 985, 1970, 7880, 2, 15600, 1, 15080, 22800] },
        { nome: "MACRORREGIONAL NOROESTE", rt: [55, 701, 1402, 5608, 2, 15600, 1, 15080, 25072] },
        { nome: "MACRORREGIONAL LESTE", rt: [66, 2384, 4768, 19072, 2, 15600, 1, 15080, 11608] },
        { nome: "MACRORREGIAO OESTE", rt: [1, 1112, 2224, 8896, 2, 15600, 1, 15080, 21784] },
    ],
    PE: [
        { nome: "VALE DO S.FRANCISCO E ARARIPE", rt: [24, 796, 1592, 6368, 1, 7800, 1, 15080, 16512] },
        { nome: "SERTAO", rt: [35, 1070, 2140, 8560, 2, 15600, 1, 15080, 22120] },
        { nome: "METROPOLITANA", rt: [58, 1040, 2080, 8320, 3, 23400, 1, 15080, 30160] },
        { nome: "AGRESTE", rt: [41, 1475, 2950, 11800, 2, 15600, 1, 15080, 18880] },
    ],
    PI: [
        { nome: "SEMI-ARIDO", rt: [70, 641, 1282, 5128, 2, 15600, 1, 15080, 25552] },
        { nome: "MEIO NORTE", rt: [41, 501, 1002, 4008, 2, 15600, 1, 15080, 26672] },
        { nome: "LITORAL", rt: [34, 526, 1052, 4208, 2, 15600, 1, 15080, 26472] },
        { nome: "CERRADOS", rt: [74, 669, 1338, 5352, 2, 15600, 1, 15080, 25328] },
    ],
    RJ: [
        { nome: "MACRORREGIAO I", rt: [45, 3566, 7132, 28528, 4, 31200, 2, 30160, 32832] },
    ],
    RN: [
        { nome: "MACRORREGIAO II", rt: [56, 660, 1320, 5280, 2, 15600, 1, 15080, 25400] },
        { nome: "MACRORREGIAO I", rt: [94, 1362, 2724, 10896, 2, 15600, 1, 15080, 19784] },
    ],
    MT: [
        { nome: "MACRORREGIAO SUL", rt: [17, 265, 530, 2120, 1, 7800, 1, 15080, 20760] },
        { nome: "MACRORREGIAO OESTE", rt: [22, 280, 560, 2240, 1, 7800, 1, 15080, 20640] },
        { nome: "MACRORREGIAO NORTE", rt: [34, 755, 1510, 6040, 1, 7800, 1, 15080, 16840] },
        { nome: "MACRORREGIAO LESTE", rt: [30, 344, 688, 2752, 1, 7800, 1, 15080, 20128] },
        { nome: "MACRORREGIAO CENTRO-NORTE", rt: [7, 67, 134, 536, 1, 7800, 1, 15080, 22344] },
        { nome: "MACRORREGIAO CENTRO-NOROESTE", rt: [24, 412, 824, 3296, 1, 7800, 1, 15080, 19584] },
    ],
    MS: [
        { nome: "PANTANAL", rt: [3, 176, 352, 1408, 1, 7800, 1, 15080, 21472] },
        { nome: "CENTRO", rt: [27, 598, 1196, 4784, 1, 7800, 1, 15080, 18096] },
        { nome: "CONE SUL", rt: [29, 727, 1454, 5816, 1, 7800, 1, 15080, 17064] },
        { nome: "COSTA LESTE", rt: [13, 441, 882, 3528, 1, 7800, 1, 15080, 19352] },
    ],
    MG: [
        { nome: "SUL", rt: [40, 723, 1446, 5784, 1, 7800, 1, 15080, 17096] },
        { nome: "CENTRO SUL", rt: [32, 511, 1022, 4088, 1, 7800, 1, 15080, 18792] },
        { nome: "CENTRO", rt: [77, 1680, 3360, 13440, 1, 7800, 1, 15080, 9440] },
        { nome: "JEQUITINHONHA", rt: [32, 601, 1202, 4808, 1, 7800, 1, 15080, 18072] },
        { nome: "OESTE", rt: [46, 1049, 2098, 8392, 1, 7800, 1, 15080, 14488] },
        { nome: "LESTE", rt: [46, 544, 1088, 4352, 1, 7800, 1, 15080, 18528] },
        { nome: "SUDESTE", rt: [79, 1193, 2386, 9544, 1, 7800, 1, 15080, 13336] },
        { nome: "NORTE", rt: [85, 1832, 3664, 14656, 1, 7800, 1, 15080, 8224] },
        { nome: "NOROESTE", rt: [30, 726, 1452, 5808, 1, 7800, 1, 15080, 17072] },
        { nome: "LESTE DO SUL", rt: [39, 704, 1408, 5632, 1, 7800, 1, 15080, 17248] },
        { nome: "NORDESTE", rt: [55, 957, 1914, 7656, 1, 7800, 1, 15080, 15224] },
        { nome: "TRIANGULO DO SUL", rt: [24, 553, 1106, 4424, 1, 7800, 1, 15080, 18456] },
        { nome: "TRIANGULO DO NORTE", rt: [23, 687, 1374, 5496, 1, 7800, 1, 15080, 17384] },
        { nome: "VALE DO ACO", rt: [22, 387, 774, 3096, 1, 7800, 1, 15080, 19784] },
        { nome: "EXTREMO SUL", rt: [34, 963, 1926, 7704, 1, 7800, 1, 15080, 15176] },
        { nome: "SUDOESTE", rt: [28, 510, 1020, 4080, 1, 7800, 1, 15080, 18800] },
    ],
    PA: [
        { nome: "MACRORREGIONAL IV", rt: [38, 1121, 2242, 8968, 2, 15600, 1, 15080, 21712] },
        { nome: "MACRORREGIONAL III", rt: [26, 714, 1428, 5712, 2, 15600, 1, 15080, 24968] },
        { nome: "MACRORREGIONAL II", rt: [46, 1258, 2516, 10064, 2, 15600, 1, 15080, 20616] },
        { nome: "MACRORREGIONAL I", rt: [24, 598, 1196, 4784, 2, 15600, 1, 15080, 25896] },
    ],
};

export class CusteioProjecaoRtxDois1700000078000 implements MigrationInterface {
    name = "CusteioProjecaoRtxDois1700000078000";

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
        // Só remove o RTx dos estados que não tinham (PR mantém o RTx importado antes).
        for (const uf of Object.keys(ESTADOS).filter(u => u !== "PR")) {
            await queryRunner.query(
                `UPDATE "custeio_projecao" SET "rt_n_acima50" = NULL, "rt_pacientes" = NULL, "rt_pessoas" = NULL, "rt_viagens" = NULL,
                    "rt_vans" = NULL, "rt_cap_vans" = NULL, "rt_micros" = NULL, "rt_cap_micros" = NULL, "rt_saldo" = NULL WHERE "uf" = $1`,
                [uf],
            );
        }
    }
}
