import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção (valores esperados) por macrorregião, importada dos compilados de RT e TRS.
 * Valores guardados como vieram nas planilhas. Seed: AM.
 */
export class CusteioProjecao1700000070000 implements MigrationInterface {
    name = "CusteioProjecao1700000070000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "custeio_projecao" (
                "uf" CHAR(2) NOT NULL,
                "macrorregiao" VARCHAR NOT NULL,
                "ordem" INTEGER NOT NULL DEFAULT 0,
                "municipios" JSONB NOT NULL DEFAULT '[]',
                "rt_n_acima50" INTEGER,
                "rt_pacientes" NUMERIC(16,4),
                "rt_pessoas" NUMERIC(16,4),
                "rt_viagens" NUMERIC(16,4),
                "rt_vans" INTEGER,
                "rt_cap_vans" NUMERIC(16,4),
                "rt_micros" INTEGER,
                "rt_cap_micros" NUMERIC(16,4),
                "rt_saldo" NUMERIC(16,4),
                "hd_n_acima50" INTEGER,
                "hd_pacientes" NUMERIC(16,4),
                "hd_pessoas" NUMERIC(16,4),
                "hd_viagens" NUMERIC(16,4),
                "hd_vans" INTEGER,
                "hd_cap_vans" NUMERIC(16,4),
                "hd_micros" INTEGER,
                "hd_cap_micros" NUMERIC(16,4),
                "hd_cap_total" NUMERIC(16,4),
                "hd_saldo" NUMERIC(16,4),
                PRIMARY KEY ("uf", "macrorregiao")
            )
        `);

        const macros: {
            nome: string; ordem: number; municipios: string[];
            rt: (number | null)[]; hd: (number | null)[];
        }[] = [
            {
                nome: "OESTE", ordem: 1,
                municipios: ["Carauari", "Eirunepé", "Envira", "Guajará", "Ipixuna", "Itamarati", "Alvarães", "Japurá", "Juruá", "Maraã", "Tefé", "Uarini", "Amaturá", "Atalaia do Norte", "Benjamin Constant", "Fonte Boa", "Jutaí", "Santo Antônio do Içá", "São Paulo de Olivença", "Tabatinga", "Tonantins"],
                // n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap vans, micros, cap micros, saldo
                rt: [20, 394.3668716009894, 788.7337432019788, 3154.934972807915, 2, 15600, 1, 15080, 27525.065027192086],
                // n>50km, pacientes, pessoas, viagens/ano, vans, cap vans, micros, cap micros, cap total, saldo
                hd: [21, 11, 12.1, 343.20000000000005, 4, 37440, 0, 0, 37440, 37096.8],
            },
            {
                nome: "LESTE", ordem: 2,
                municipios: ["Apuí", "Borba", "Humaitá", "Manicoré", "Novo Aripuanã", "Itacoatiara", "Itapiranga", "São Sebastião do Uatumã", "Silves", "Urucará", "Urucurituba", "Barreirinha", "Boa Vista do Ramos", "Maués", "Nhamundá", "Parintins"],
                rt: [5, 447.0153174021638, 894, 3576, 2, 15600, 1, 15080, 27104],
                hd: [16, 190, 209, 5928, 3, 28080, 3, 54288, 82368, 76440],
            },
            {
                nome: "CENTRAL", ordem: 3,
                municipios: ["Autazes", "Barcelos", "Careiro", "Careiro da Várzea", "Iranduba", "Manaquiri", "Manaus", "Nova Olinda do Norte", "Presidente Figueiredo", "Rio Preto da Eva", "Santa Isabel do Rio Negro", "São Gabriel da Cachoeira", "Anamã", "Anori", "Beruri", "Caapiranga", "Coari", "Codajás", "Manacapuru", "Novo Airão", "Boca do Acre", "Canutama", "Lábrea", "Pauini", "Tapauá"],
                rt: [9, 507, 1014, 4056, 2, 15600, 1, 15080, 26624],
                hd: [23, 276, 303.6, 8611.2, 4, 37440, 3, 54288, 91728, 83116.8],
            },
        ];

        for (const m of macros) {
            await queryRunner.query(
                `INSERT INTO "custeio_projecao" (
                    "uf","macrorregiao","ordem","municipios",
                    "rt_n_acima50","rt_pacientes","rt_pessoas","rt_viagens","rt_vans","rt_cap_vans","rt_micros","rt_cap_micros","rt_saldo",
                    "hd_n_acima50","hd_pacientes","hd_pessoas","hd_viagens","hd_vans","hd_cap_vans","hd_micros","hd_cap_micros","hd_cap_total","hd_saldo"
                ) VALUES ('AM',$1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
                ON CONFLICT ("uf","macrorregiao") DO NOTHING`,
                [m.nome, m.ordem, JSON.stringify(m.municipios), ...m.rt, ...m.hd],
            );
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "custeio_projecao"`);
    }
}
