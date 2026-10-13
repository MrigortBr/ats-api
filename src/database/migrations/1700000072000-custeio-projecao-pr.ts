import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção do Paraná por macrorregião (compilados de RTx e TRS), valores como vieram nas planilhas.
 * rt: [n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, saldo]
 * hd: [n>50km, pacientes, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, cap. total, saldo]
 * Municípios de cada macro conferidos com a base (399, todos batem). Obs.: na planilha de RTx, o "nº de municípios > 50 km" da Macro Oeste é 1 (provável erro de digitação, mantido como veio).
 */
type Dados = (number | null)[];
const MACROS: { nome: string; ordem: number; municipios: string[]; rt: Dados; hd: Dados }[] = [
    {
        nome: "MACRORREGIONAL NORTE", ordem: 1,
        municipios: ["Apucarana", "Cambira", "Arapongas", "Califórnia", "Jandaia do Sul", "Marilândia do Sul", "Novo Itacolomi", "Rio Bom", "Sabáudia", "Marumbi", "Bom Sucesso", "Kaloré", "Borrazópolis", "Mauá da Serra", "Faxinal", "São Pedro do Ivaí", "Grandes Rios", "Londrina", "Cambé", "Ibiporã", "Jataizinho", "Rolândia", "Sertanópolis", "Assaí", "Bela Vista do Paraíso", "Prado Ferreira", "Pitangueiras", "Tamarana", "Jaguapitã", "Primeiro de Maio", "Florestópolis", "Alvorada do Sul", "Guaraci", "Porecatu", "Centenário do Sul", "Cafeara", "Miraselva", "Lupionópolis", "Santo Antônio do Paraíso", "Rancho Alegre", "Uraí", "Nova Santa Bárbara", "São Sebastião da Amoreira", "Sertaneja", "Nova América da Colina", "Santa Cecília do Pavão", "Leópolis", "São Jerônimo da Serra", "Cornélio Procópio", "Congonhinhas", "Nova Fátima", "Santa Mariana", "Santa Amélia", "Ribeirão do Pinhal", "Itambaracá", "Bandeirantes", "Sapopema", "Abatiá", "Andirá", "Jundiaí do Sul", "Figueira", "Conselheiro Mairinck", "Guapirama", "Santo Antônio da Platina", "Barra do Jacaré", "Cambará", "Ibaiti", "Japira", "Jaboti", "Jacarezinho", "Pinhalão", "Joaquim Távora", "Tomazina", "Quatiguá", "Siqueira Campos", "Ribeirão Claro", "Carlópolis", "Wenceslau Braz", "São José da Boa Vista", "Salto do Itararé", "Santana do Itararé", "Ariranha do Ivaí", "Arapuã", "São João do Ivaí", "Cruzmaltina", "Lunardelli", "Lidianópolis", "Jardim Alegre", "Godoy Moreira", "Ivaiporã", "Rio Branco do Ivaí", "Rosário do Ivaí", "Manoel Ribas", "Nova Tebas", "Cândido de Abreu", "Mato Rico", "Santa Maria do Oeste"],
        rt: [62, 985, 1970, 7880, 2, 15600, 1, 15080, 22800],
        hd: [39, 243, 255.15, 79606.8, 5, 46800, 2, 36192, 82992, 3385.199999999997],
    },
    {
        nome: "MACRORREGIONAL NOROESTE", ordem: 2,
        municipios: ["Campo Mourão", "Peabiru", "Araruna", "Farol", "Corumbataí do Sul", "Engenheiro Beltrão", "Luiziana", "Terra Boa", "Mamborê", "Quinta do Sol", "Barbosa Ferraz", "Janiópolis", "Fênix", "Moreira Sales", "Iretama", "Goioerê", "Quarto Centenário", "Roncador", "Rancho Alegre D'Oeste", "Juranda", "Nova Cantu", "Campina da Lagoa", "Ubiratã", "Boa Esperança", "Altamira do Paraná", "Umuarama", "Xambrê", "Maria Helena", "Esperança Nova", "Perobal", "Cruzeiro do Oeste", "Alto Piquiri", "Pérola", "Mariluz", "Ivaté", "Nova Olímpia", "Douradina", "Tapira", "Iporã", "Brasilândia do Sul", "Icaraíma", "São Jorge do Patrocínio", "Altônia", "Francisco Alves", "Cafezal do Sul", "Alto Paraíso", "Japurá", "Tapejara", "Jussara", "Tuneiras do Oeste", "Cianorte", "São Tomé", "Cidade Gaúcha", "São Manoel do Paraná", "Rondon", "Indianópolis", "Guaporema", "Santa Mônica", "Mirador", "Alto Paraná", "São Carlos do Ivaí", "Nova Aliança do Ivaí", "Paranavaí", "Tamboara", "Paraíso do Norte", "Querência do Norte", "São João do Caiuá", "Inajá", "Cruzeiro do Sul", "Santa Isabel do Ivaí", "Paranapoema", "Santo Antônio do Caiuá", "Santa Cruz de Monte Castelo", "Jardim Olinda", "Amaporã", "Planaltina do Paraná", "Guairaçá", "Loanda", "Terra Rica", "São Pedro do Paraná", "Porto Rico", "Nova Londrina", "Marilena", "Itaúna do Sul", "Diamante do Norte", "Maringá", "Sarandi", "Paiçandu", "Marialva", "Atalaia", "Mandaguaçu", "Floresta", "Ângulo", "Itambé", "Iguaraçu", "Presidente Castelo Branco", "Ourizona", "Mandaguari", "Doutor Camargo", "Astorga", "Munhoz de Melo", "Ivatuba", "São Jorge do Ivaí", "Nova Esperança", "Flórida", "Floraí", "Uniflor", "Lobato", "Santa Fé", "Nossa Senhora das Graças", "Paranacity", "Colorado", "Santo Inácio", "Itaguajé", "Santa Inês"],
        rt: [55, 701, 1402, 5608, 2, 15600, 1, 15080, 25072],
        hd: [47, 269, 295.9, 92320.79999999999, 9, 84240, 3, 54288, 138528, 46207.20000000001],
    },
    {
        nome: "MACRORREGIONAL LESTE", ordem: 3,
        municipios: ["Morretes", "Antonina", "Paranaguá", "Pontal do Paraná", "Guaraqueçaba", "Matinhos", "Guaratuba", "Campina Grande do Sul", "Curitiba", "Quatro Barras", "Pinhais", "Almirante Tamandaré", "Bocaiúva do Sul", "São José dos Pinhais", "Piraquara", "Colombo", "Campo Magro", "Araucária", "Itaperuçu", "Fazenda Rio Grande", "Campo Largo", "Rio Branco do Sul", "Tunas do Paraná", "Contenda", "Mandirituba", "Balsa Nova", "Quitandinha", "Tijucas do Sul", "Cerro Azul", "Lapa", "Agudos do Sul", "Adrianópolis", "Campo do Tenente", "Piên", "Doutor Ulysses", "Rio Negro", "Ponta Grossa", "Porto Amazonas", "Palmeira", "Ivaí", "Ipiranga", "Carambeí", "Castro", "São João do Triunfo", "Piraí do Sul", "Jaguariaíva", "Sengés", "Arapoti", "Inácio Martins", "Guamiranga", "Rio Azul", "Rebouças", "Irati", "Mallet", "Fernandes Pinheiro", "Imbituva", "Teixeira Soares", "Guarapuava", "Pinhão", "Turvo", "Palmital", "Campina do Simão", "Prudentópolis", "Goioxim", "Candói", "Cantagalo", "Virmond", "Reserva do Iguaçu", "Boa Ventura de São Roque", "Pitanga", "Marquinho", "Foz do Jordão", "Laranjeiras do Sul", "Laranjal", "Porto Barreiro", "Rio Bonito do Iguaçu", "Nova Laranjeiras", "Cruz Machado", "Bituruna", "Porto Vitória", "Paulo Frontin", "União da Vitória", "Paula Freitas", "Antônio Olinto", "General Carneiro", "São Mateus do Sul", "Reserva", "Imbaú", "Ortigueira", "Tibagi", "Telêmaco Borba", "Ventania", "Curiúva"],
        rt: [66, 2384, 4768, 19072, 2, 15600, 1, 15080, 11608],
        hd: [48, 522, 574.2, 179150.40000000002, 8, 74880, 5, 90480, 165360, -13790.400000000023],
    },
    {
        nome: "MACRORREGIAO OESTE", ordem: 4,
        municipios: ["Pato Branco", "Vitorino", "Mariópolis", "Bom Sucesso do Sul", "Coronel Vivida", "Itapejara d'Oeste", "Clevelândia", "Chopinzinho", "São João", "Honório Serpa", "Mangueirinha", "Sulina", "Coronel Domingos Soares", "Saudade do Iguaçu", "Palmas", "Renascença", "Marmeleiro", "Francisco Beltrão", "Enéas Marques", "Verê", "São Jorge d'Oeste", "Manfrinópolis", "Dois Vizinhos", "Flor da Serra do Sul", "Nova Esperança do Sudoeste", "Nova Prata do Iguaçu", "Cruzeiro do Iguaçu", "Salto do Lontra", "Capanema", "Boa Esperança do Iguaçu", "Salgado Filho", "Pinhal de São Bento", "Planalto", "Ampére", "Realeza", "Bom Jesus do Sul", "Santa Izabel do Oeste", "Bela Vista da Caroba", "Pranchita", "Pérola d'Oeste", "Santo Antônio do Sudoeste", "Barracão", "Foz do Iguaçu", "Santa Terezinha de Itaipu", "São Miguel do Iguaçu", "Itaipulândia", "Medianeira", "Serranópolis do Iguaçu", "Missal", "Ramilândia", "Matelândia", "Cascavel", "Santa Tereza do Oeste", "Corbélia", "Lindoeste", "Cafelândia", "Catanduvas", "Vera Cruz do Oeste", "Anahy", "Céu Azul", "Ibema", "Campo Bonito", "Braganey", "Santa Lúcia", "Nova Aurora", "Espigão Alto do Iguaçu", "Três Barras do Paraná", "Iracema do Oeste", "Guaraniaçu", "Capitão Leônidas Marques", "Diamante do Sul", "Boa Vista da Aparecida", "Jesuítas", "Formosa do Oeste", "Quedas do Iguaçu", "Iguatu", "Tupãssi", "Toledo", "Diamante D'Oeste", "Assis Chateaubriand", "Quatro Pontes", "São José das Palmeiras", "Nova Santa Rosa", "São Pedro do Iguaçu", "Maripá", "Marechal Cândido Rondon", "Ouro Verde do Oeste", "Santa Helena", "Palotina", "Entre Rios do Oeste", "Pato Bragado", "Mercedes", "Terra Roxa", "Guaíra"],
        rt: [1, 1112, 2224, 8896, 2, 15600, 1, 15080, 21784],
        hd: [58, 516, 567.6, 177091.2, 8, 74880, 5, 90480, 165360, -11731.200000000012],
    },
];

export class CusteioProjecaoPR1700000072000 implements MigrationInterface {
    name = "CusteioProjecaoPR1700000072000";

    async up(queryRunner: QueryRunner): Promise<void> {
        for (const m of MACROS) {
            await queryRunner.query(
                `INSERT INTO "custeio_projecao" (
                    "uf","macrorregiao","ordem","municipios",
                    "rt_n_acima50","rt_pacientes","rt_pessoas","rt_viagens","rt_vans","rt_cap_vans","rt_micros","rt_cap_micros","rt_saldo",
                    "hd_n_acima50","hd_pacientes","hd_pessoas","hd_viagens","hd_vans","hd_cap_vans","hd_micros","hd_cap_micros","hd_cap_total","hd_saldo"
                ) VALUES ('PR',$1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
                ON CONFLICT ("uf","macrorregiao") DO NOTHING`,
                [m.nome, m.ordem, JSON.stringify(m.municipios), ...m.rt, ...m.hd],
            );
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "custeio_projecao" WHERE "uf" = 'PR'`);
    }
}
