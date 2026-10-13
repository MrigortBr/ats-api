import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção de RTx (radioterapia) de RR, TO, SE, SP, SC, RS e RO, dos compilados de RTx filtrados por UF (últimos estados).
 * Preenche as colunas rt_* de custeio_projecao (UPDATE por uf + macrorregião; RS e RO já tinham RTx e são atualizados).
 * rt: [n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, saldo]
 * Valores como vieram nas planilhas.
 */
type Dados = (number | null)[];
const ESTADOS: Record<string, { nome: string; rt: Dados }[]> = {
    RS: [
        { nome: "VALES", rt: [18, 333, 666, 2664, 2, 15600, 1, 15080, 28016] },
        { nome: "SUL", rt: [19, 897, 1794, 7176, 2, 15600, 1, 15080, 23504] },
        { nome: "SERRA", rt: [28, 289, 578, 2312, 2, 15600, 1, 15080, 28368] },
        { nome: "NORTE", rt: [111, 1138, 2276, 9104, 2, 15600, 1, 15080, 21576] },
        { nome: "MISSIONEIRA", rt: [54, 741, 1482, 5928, 2, 15600, 1, 15080, 24752] },
        { nome: "METROPOLITANA", rt: [65, 1465, 2930, 11720, 2, 15600, 1, 15080, 18960] },
        { nome: "CENTRO-OESTE", rt: [33, 870, 1740, 6960, 2, 15600, 1, 15080, 23720] },
    ],
    RO: [
        { nome: "MACRORREGIONAL II (CACOAL)", rt: [30, 531, 1062, 4248, 2, 15600, 1, 15080, 26432] },
        { nome: "MACRORREGIAO I - PORTO VELHO", rt: [16, 328, 656, 2624, 2, 15600, 1, 15080, 28056] },
    ],
    RR: [
        { nome: "MACRO-RORAIMA", rt: [13, 159, 318, 1272, 2, 15600, 1, 15080, 29408] },
    ],
    SP: [
        { nome: "RRAS9", rt: [33, 1202, 2404, 9616, 1, 7800, 1, 15080, 13264] },
        { nome: "RRAS8", rt: [35, 1485, 2970, 11880, 1, 7800, 1, 15080, 11000] },
        { nome: "RRAS7", rt: [19, 913, 1826, 7304, 1, 7800, 1, 15080, 15576] },
        { nome: "RRAS6", rt: [0, 82, 164, 656, 1, 7800, 1, 15080, 22224] },
        { nome: "RRAS5", rt: [0, 82, 164, 656, 1, 7800, 1, 15080, 22224] },
        { nome: "RRAS4", rt: [1, 46, 92, 368, 1, 7800, 1, 15080, 22512] },
        { nome: "RRAS3", rt: [0, 82, 164, 656, 1, 7800, 1, 15080, 22224] },
        { nome: "RRAS2", rt: [0, 82, 164, 656, 1, 7800, 1, 15080, 22224] },
        { nome: "RRAS17", rt: [17, 427, 854, 3416, 1, 7800, 1, 15080, 19464] },
        { nome: "RRAS16", rt: [0, 82, 164, 656, 1, 7800, 1, 15080, 22224] },
        { nome: "RRAS15", rt: [22, 848, 1696, 6784, 1, 7800, 1, 15080, 16096] },
        { nome: "RRAS14", rt: [4, 121, 242, 968, 1, 7800, 1, 15080, 21912] },
        { nome: "RRAS13", rt: [20, 411, 822, 3288, 1, 7800, 1, 15080, 19592] },
        { nome: "RRAS12", rt: [27, 321, 642, 2568, 1, 7800, 1, 15080, 20312] },
        { nome: "RRAS11", rt: [24, 490, 980, 3920, 1, 7800, 1, 15080, 18960] },
        { nome: "RRAS10", rt: [32, 700, 1400, 5600, 1, 7800, 1, 15080, 17280] },
        { nome: "RRAS1", rt: [0, 82, 164, 656, 1, 7800, 1, 15080, 22224] },
        { nome: "RRAS18", rt: [7, 252, 504, 2016, 1, 7800, 1, 15080, 20864] },
        { nome: "RRAS19", rt: [36, 984, 1968, 7872, 1, 7800, 1, 15080, 15008] },
    ],
    SC: [
        { nome: "SUL", rt: [8, 207, 414, 1656, 2, 15600, 1, 15080, 29024] },
        { nome: "PLANALTO NORTE E NORDESTE", rt: [11, 533, 1066, 4264, 2, 15600, 1, 15080, 26416] },
        { nome: "GRANDE OESTE", rt: [51, 780, 1560, 6240, 2, 15600, 1, 15080, 24440] },
        { nome: "GRANDE FLORIANOPOLIS", rt: [6, 82, 164, 656, 2, 15600, 1, 15080, 30024] },
        { nome: "FOZ DO RIO ITAJAI", rt: [0, 82, 164, 656, 2, 15600, 1, 15080, 30024] },
        { nome: "VALE DO ITAJAI", rt: [27, 587, 1174, 4696, 2, 15600, 1, 15080, 25984] },
        { nome: "MEIO OESTE", rt: [24, 615, 1230, 4920, 2, 15600, 1, 15080, 25760] },
        { nome: "SERRA CATARINENSE", rt: [8, 135, 270, 1080, 2, 15600, 1, 15080, 29600] },
    ],
    SE: [
        { nome: "MACRO UNICA", rt: [62, 1273, 2546, 10184, 2, 15600, 1, 15080, 20496] },
    ],
    TO: [
        { nome: "MACRORREGIAO DE SAUDE NORTE", rt: [58, 383, 766, 3064, 2, 15600, 1, 15080, 27616] },
        { nome: "MACRORREGIAO CENTRO-SUL", rt: [72, 505, 1010, 4040, 2, 15600, 1, 15080, 26640] },
    ],
};

export class CusteioProjecaoRtxTres1700000079000 implements MigrationInterface {
    name = "CusteioProjecaoRtxTres1700000079000";

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
        // Só remove o RTx dos estados que não tinham (RS e RO mantêm o RTx importado antes).
        for (const uf of Object.keys(ESTADOS).filter(u => u !== "RS" && u !== "RO")) {
            await queryRunner.query(
                `UPDATE "custeio_projecao" SET "rt_n_acima50" = NULL, "rt_pacientes" = NULL, "rt_pessoas" = NULL, "rt_viagens" = NULL,
                    "rt_vans" = NULL, "rt_cap_vans" = NULL, "rt_micros" = NULL, "rt_cap_micros" = NULL, "rt_saldo" = NULL WHERE "uf" = $1`,
                [uf],
            );
        }
    }
}
