import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção de Rondônia por macrorregião (compilados de RTx e TRS), valores como vieram nas planilhas.
 * rt: [n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, saldo]
 * hd: [n>50km, pacientes, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, cap. total, saldo]
 * Municípios de cada macro conferidos com a base (52, todos batem). RTx Cacoal: planilha declara 30 municípios > 50 km, mas lista 31; valor mantido como veio.
 */
type Dados = (number | null)[];
const MACROS: { nome: string; ordem: number; municipios: string[]; rt: Dados; hd: Dados }[] = [
    {
        nome: "MACRORREGIONAL II (CACOAL)", ordem: 1,
        municipios: ["Cacoal", "Ministro Andreazza", "Pimenta Bueno", "São Felipe D'Oeste", "Espigão D'Oeste", "Primavera de Rondônia", "Presidente Médici", "Teixeirópolis", "Ji-Paraná", "Alvorada D'Oeste", "Ouro Preto do Oeste", "Urupá", "São Miguel do Guaporé", "Vale do Paraíso", "Nova União", "Mirante da Serra", "Rolim de Moura", "Castanheiras", "Santa Luzia D'Oeste", "Novo Horizonte do Oeste", "Parecis", "Alta Floresta D'Oeste", "Alto Alegre dos Parecis", "Nova Brasilândia D'Oeste", "Chupinguaia", "Vilhena", "Corumbiara", "Colorado do Oeste", "Cerejeiras", "Cabixi", "Pimenteiras do Oeste", "Seringueiras", "São Francisco do Guaporé", "Costa Marques"],
        rt: [30, 531, 1062, 4248, 0, 0, 3, 45240, 40992],
        hd: [27, 259, 284.9, 88888.79999999999, 3, 28080, 4, 72384, 100464, 11575.200000000012],
    },
    {
        nome: "MACRORREGIAO I - PORTO VELHO", ordem: 2,
        municipios: ["Rio Crespo", "Ariquemes", "Alto Paraíso", "Cujubim", "Buritis", "Monte Negro", "Cacaulândia", "Machadinho D'Oeste", "Campo Novo de Rondônia", "Jaru", "Theobroma", "Governador Jorge Teixeira", "Vale do Anari", "Porto Velho", "Candeias do Jamari", "Itapuã do Oeste", "Nova Mamoré", "Guajará-Mirim"],
        rt: [16, 328, 656, 2624, 0, 0, 3, 45240, 42616],
        hd: [15, 208, 228.8, 71385.6, 3, 28080, 4, 72384, 100464, 29078.399999999994],
    },
];

export class CusteioProjecaoRO1700000074000 implements MigrationInterface {
    name = "CusteioProjecaoRO1700000074000";

    async up(queryRunner: QueryRunner): Promise<void> {
        for (const m of MACROS) {
            await queryRunner.query(
                `INSERT INTO "custeio_projecao" (
                    "uf","macrorregiao","ordem","municipios",
                    "rt_n_acima50","rt_pacientes","rt_pessoas","rt_viagens","rt_vans","rt_cap_vans","rt_micros","rt_cap_micros","rt_saldo",
                    "hd_n_acima50","hd_pacientes","hd_pessoas","hd_viagens","hd_vans","hd_cap_vans","hd_micros","hd_cap_micros","hd_cap_total","hd_saldo"
                ) VALUES ('RO',$1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
                ON CONFLICT ("uf","macrorregiao") DO NOTHING`,
                [m.nome, m.ordem, JSON.stringify(m.municipios), ...m.rt, ...m.hd],
            );
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "custeio_projecao" WHERE "uf" = 'RO'`);
    }
}
