import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção da Bahia por macrorregião (compilados de RTx e TRS), valores como vieram nas planilhas.
 * rt: [n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, saldo]
 * hd: [n>50km, pacientes, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, cap. total, saldo]
 * A planilha de TRS da BA não traz o saldo (null). Municípios de cada macro conferidos com a base (417, todos batem).
 */
type Dados = (number | null)[];
const MACROS: { nome: string; ordem: number; municipios: string[]; rt: Dados; hd: Dados }[] = [
    {
        nome: "SUL (NBS - ILHEUS)", ordem: 1,
        municipios: ["Ilhéus", "Uruçuca", "Arataca", "Una", "Santa Luzia", "Itacaré", "Mascote", "Canavieiras", "Itabuna", "Itajuípe", "Buerarema", "Itapé", "Barro Preto", "São José da Vitória", "Ibicaraí", "Coaraci", "Floresta Azul", "Aurelino Leal", "Almadina", "Ubaitaba", "Jussari", "Itapitanga", "Santa Cruz da Vitória", "Camacan", "Ibirapitanga", "Ubatã", "Itaju do Colônia", "Gongogi", "Pau Brasil", "Maraú", "Barra do Rocha", "Dário Meira", "Ipiaú", "Irajuba", "Ibirataia", "Itagibá", "Boa Nova", "Jitaúna", "Aiquara", "Itamari", "Itagi", "Jequié", "Apuarema", "Manoel Vitorino", "Lafaiete Coutinho", "Cravolândia", "Santa Inês", "Itiruçu", "Jaguaquara", "Lajedo do Tabocal", "Itaquara", "Maracás", "Planaltino", "Nova Itarana", "Brejões", "Iramaia", "Camamu", "Igrapiúna", "Gandu", "Wenceslau Guimarães", "Ituberá", "Piraí do Norte", "Nova Ibiá", "Nilo Peçanha", "Taperoá", "Cairu", "Valença"],
        rt: [53, 1305, 2610, 10440, 2, 15600, 1, 15080, 20240],
        hd: [45, 533, 586.3, 182925.59999999998, 9, 84240, 5, 90480, 174720, null],
    },
    {
        nome: "SUDOESTE (NBS - VITORIA CONQUISTA)", ordem: 2,
        municipios: ["Aracatu", "Tanhaçu", "Brumado", "Ituaçu", "Guajeru", "Contendas do Sincorá", "Malhada de Pedras", "Barra da Estiva", "Dom Basílio", "Livramento de Nossa Senhora", "Rio de Contas", "Ibicoara", "Jussiape", "Paramirim", "Caturama", "Érico Cardoso", "Rio do Pires", "Macaúbas", "Ibipitanga", "Boquira", "Rio do Antônio", "Caculé", "Jacaraci", "Ibiassucê", "Lagoa Real", "Licínio de Almeida", "Mortugaba", "Caetité", "Urandi", "Guanambi", "Pindaí", "Igaporã", "Sebastião Laranjeiras", "Candiba", "Botuporã", "Riacho de Santana", "Tanque Novo", "Matina", "Palmas de Monte Alto", "Iuiu", "Malhada", "Carinhanha", "Feira da Mata", "Itambé", "Caatiba", "Itapetinga", "Nova Canaã", "Iguaí", "Itororó", "Ibicuí", "Macarani", "Maiquinique", "Firmino Alves", "Potiraguá", "Itarantim", "Vitória da Conquista", "Barra do Choça", "Planalto", "Anagé", "Belo Campo", "Poções", "Caetanos", "Caraíbas", "Tremedal", "Cândido Sales", "Bom Jesus da Serra", "Maetinga", "Ribeirão do Largo", "Piripá", "Presidente Jânio Quadros", "Mirante", "Encruzilhada", "Condeúba", "Cordeiros"],
        rt: [72, 397, 794, 3176, 3, 23400, 1, 15080, 35304],
        hd: [56, 700, 770, 240240, 11, 102960, 8, 144768, 247728, null],
    },
    {
        nome: "OESTE (NBS - BARREIRAS)", ordem: 3,
        municipios: ["Angical", "Baianópolis", "Barreiras", "Brejolândia", "Catolândia", "Cotegipe", "Cristópolis", "Formosa do Rio Preto", "Luís Eduardo Magalhães", "Mansidão", "Riachão das Neves", "Santa Rita de Cássia", "São Desidério", "Tabocas do Brejo Velho", "Wanderley", "Barra", "Brotas de Macaúbas", "Buritirama", "Ibotirama", "Ipupiara", "Morpará", "Muquém do São Francisco", "Oliveira dos Brejinhos", "Paratinga", "Bom Jesus da Lapa", "Canápolis", "Cocos", "Coribe", "Correntina", "Jaborandi", "Santa Maria da Vitória", "Santana", "São Félix do Coribe", "Serra do Ramalho", "Serra Dourada", "Sítio do Mato"],
        rt: [35, 1216, 2432, 9728, 2, 15600, 1, 15080, 20952],
        hd: [29, 505, 555.5, 173316, 6, 56160, 6, 108576, 164736, null],
    },
    {
        nome: "NORTE - (NRS - JUAZEIRO)", ordem: 4,
        municipios: ["Juazeiro", "Sobradinho", "Casa Nova", "Curaçá", "Uauá", "Canudos", "Sento Sé", "Remanso", "Campo Alegre de Lourdes", "Pilão Arcado", "Abaré", "Chorrochó", "Rodelas", "Macururé", "Jeremoabo", "Pedro Alexandre", "Santa Brígida", "Glória", "Paulo Afonso", "Jaguarari", "Senhor do Bonfim", "Antônio Gonçalves", "Campo Formoso", "Andorinha", "Filadélfia", "Pindobaçu", "Ponto Novo", "Itiúba"],
        rt: [27, 1029, 2058, 8232, 1, 7800, 1, 15080, 14648],
        hd: [16, 347, 373.1, 116407.20000000001, 3, 28080, 5, 90480, 118560, null],
    },
    {
        nome: "NORDESTE (NRS - ALAGOINHAS)", ordem: 5,
        municipios: ["Pedrão", "Ouriçangas", "Alagoinhas", "Aramari", "Catu", "Araçás", "Sátiro Dias", "Inhambupe", "Entre Rios", "Itanagra", "Cardeal da Silva", "Esplanada", "Aporá", "Acajutiba", "Crisópolis", "Itapicuru", "Jandaíra", "Rio Real", "Nova Soure", "Tucano", "Cipó", "Olindina", "Ribeira do Amparo", "Ribeira do Pombal", "Cícero Dantas", "Banzaê", "Heliópolis", "Fátima", "Antas", "Novo Triunfo", "Sítio do Quinto", "Adustina", "Paripiranga", "Coronel João Sá"],
        rt: [34, 135, 270, 1080, 1, 7800, 1, 15080, 21800],
        hd: [18, 261, 287.1, 89575.20000000001, 4, 37440, 3, 54288, 91728, null],
    },
    {
        nome: "LESTE - (NRS - SALVADOR)", ordem: 6,
        municipios: ["Simões Filho", "Camaçari", "Mata de São João", "Conde", "Pojuca", "Dias d'Ávila", "Conceição da Feira", "Cabaceiras do Paraguaçu", "São Félix", "Cachoeira", "Governador Mangabeira", "Muritiba", "Cruz das Almas", "Maragogipe", "Sapeaçu", "Salvador", "Vera Cruz", "Lauro de Freitas", "Itaparica", "Candeias", "Santo Amaro", "Madre de Deus", "São Sebastião do Passé", "São Francisco do Conde", "Saubara", "Salinas da Margarida", "Aratuípe", "Conceição do Almeida", "Castro Alves", "Itatim", "Jaguaripe", "São Felipe", "Santa Terezinha", "Dom Macedo Costa", "Santo Antônio de Jesus", "Milagres", "Varzedo", "Muniz Ferreira", "Elísio Medrado", "Nazaré", "São Miguel das Matas", "Amargosa", "Laje", "Mutuípe", "Jiquiriçá", "Presidente Tancredo Neves", "Ubaíra", "Teolândia"],
        rt: [44, 67, 134, 536, 3, 23400, 1, 15080, 37944],
        hd: [16, 275, 302.5, 94380, 4, 37440, 3, 54288, 91728, null],
    },
    {
        nome: "EXTREMO SUL (NRS - TEIXEIRA FREITAS)", ordem: 7,
        municipios: ["Itapebi", "Itagimirim", "Itabela", "Eunápolis", "Guaratinga", "Santa Cruz Cabrália", "Porto Seguro", "Belmonte", "Itamaraju", "Prado", "Teixeira de Freitas", "Alcobaça", "Vereda", "Jucuruçu", "Caravelas", "Medeiros Neto", "Itanhém", "Lajedão", "Ibirapuã", "Nova Viçosa", "Mucuri"],
        rt: [17, 980, 1960, 7840, 2, 15600, 1, 15080, 22840],
        hd: [17, 402, 442.2, 137966.4, 3, 28080, 6, 108576, 136656, null],
    },
    {
        nome: "CENTRO-LESTE (NRS - FEIRA SANTANA)", ordem: 8,
        municipios: ["Feira de Santana", "São Gonçalo dos Campos", "Conceição do Jacuípe", "Amélia Rodrigues", "Coração de Maria", "Antônio Cardoso", "Santa Bárbara", "Santanópolis", "Anguera", "Santo Estêvão", "Tanquinho", "Irará", "Teodoro Sampaio", "Serra Preta", "Terra Nova", "Candeal", "Ipecaetá", "Ichu", "Riachão do Jacuípe", "Rafael Jambeiro", "Ipirá", "Pé de Serra", "Nova Fátima", "Gavião", "Capela do Alto Alegre", "Pintadas", "Baixa Grande", "Mundo Novo", "Itaberaba", "Iaçu", "Macajuba", "Ruy Barbosa", "Boa Vista do Tupim", "Marcionílio Souza", "Lajedinho", "Ibiquera", "Itaeté", "Wagner", "Utinga", "Bonito", "Nova Redenção", "Andaraí", "Abaíra", "Piatã", "Lençóis", "Boninal", "Palmeiras", "Mucugê", "Seabra", "Iraquara", "Novo Horizonte", "Souto Soares", "Ibitiara", "Lamarão", "Serrinha", "Água Fria", "Teofilândia", "Barrocas", "Biritinga", "Araci", "Conceição do Coité", "Retirolândia", "Valente", "São Domingos", "Santaluz", "Queimadas", "Euclides da Cunha", "Quijingue", "Cansanção", "Nordestina", "Monte Santo"],
        rt: [69, 134, 268, 1072, 2, 15600, 1, 15080, 29608],
        hd: [17, 441, 485.1, 151351.2, 9, 84240, 4, 72384, 156624, null],
    },
    {
        nome: "CENTRO - NORTE (NRS - JACOBINA)", ordem: 9,
        municipios: ["Uibaí", "Jussara", "América Dourada", "Central", "Cafarnaum", "João Dourado", "Presidente Dutra", "Itaguaçu da Bahia", "Irecê", "Mulungu do Morro", "Lapão", "Canarana", "São Gabriel", "Ibititá", "Barro Alto", "Ibipeba", "Xique-Xique", "Barra do Mendes", "Gentio do Ouro", "Capim Grosso", "São José do Jacuípe", "Quixabeira", "Mairi", "Várzea da Roça", "Serrolândia", "Piritiba", "Várzea do Poço", "Caém", "Jacobina", "Tapiramutá", "Saúde", "Miguel Calmon", "Mirangaba", "Caldeirão Grande", "Morro do Chapéu", "Várzea Nova", "Ourolândia", "Umburanas"],
        rt: [28, 984, 1968, 7872, 2, 15600, 1, 15080, 22808],
        hd: [19, 264, 290.4, 90604.79999999999, 5, 46800, 2, 36192, 82992, null],
    },
];

export class CusteioProjecaoBA1700000071000 implements MigrationInterface {
    name = "CusteioProjecaoBA1700000071000";

    async up(queryRunner: QueryRunner): Promise<void> {
        for (const m of MACROS) {
            await queryRunner.query(
                `INSERT INTO "custeio_projecao" (
                    "uf","macrorregiao","ordem","municipios",
                    "rt_n_acima50","rt_pacientes","rt_pessoas","rt_viagens","rt_vans","rt_cap_vans","rt_micros","rt_cap_micros","rt_saldo",
                    "hd_n_acima50","hd_pacientes","hd_pessoas","hd_viagens","hd_vans","hd_cap_vans","hd_micros","hd_cap_micros","hd_cap_total","hd_saldo"
                ) VALUES ('BA',$1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
                ON CONFLICT ("uf","macrorregiao") DO NOTHING`,
                [m.nome, m.ordem, JSON.stringify(m.municipios), ...m.rt, ...m.hd],
            );
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "custeio_projecao" WHERE "uf" = 'BA'`);
    }
}
