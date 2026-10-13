import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Projeção do Rio Grande do Sul por macrorregião (compilados de RTx e TRS), valores como vieram nas planilhas.
 * rt: [n>50km, pacientes>50km, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, saldo]
 * hd: [n>50km, pacientes, pessoas, viagens/ano, vans, cap. vans, micros, cap. micros, cap. total, saldo]
 * Municípios de cada macro conferidos com a base (497, todos batem).
 */
type Dados = (number | null)[];
const MACROS: { nome: string; ordem: number; municipios: string[]; rt: Dados; hd: Dados }[] = [
    {
        nome: "VALES", ordem: 1,
        municipios: ["Passa Sete", "Estrela Velha", "Segredo", "Lagoa Bonita do Sul", "Arroio do Tigre", "Sobradinho", "Ibarama", "Cerro Branco", "Cachoeira do Sul", "Novo Cabrais", "Encruzilhada do Sul", "Caçapava do Sul", "Santa Cruz do Sul", "Mato Leitão", "Vale Verde", "Vera Cruz", "Sinimbu", "Herveiras", "Candelária", "Vale do Sol", "Venâncio Aires", "Rio Pardo", "Passo do Sobrado", "Gramado Xavier", "Pantano Grande", "Lajeado", "Travesseiro", "Arroio do Meio", "Cruzeiro do Sul", "Santa Clara do Sul", "São José do Herval", "Forquetinha", "Canudos do Vale", "Roca Sales", "Sério", "Coqueiro Baixo", "Relvado", "Progresso", "Encantado", "Anta Gorda", "Doutor Ricardo", "Marques de Souza", "Nova Bréscia", "Vespasiano Corrêa", "Pouso Novo", "Muçum", "Ilópolis", "Putinga", "Boqueirão do Leão", "São Valentim do Sul", "Capitão", "Dois Lajeados", "Poço das Antas", "Paverama", "Colinas", "Teutônia", "Westfália", "Estrela", "Imigrante", "Taquari", "Fazenda Vilanova", "Bom Retiro do Sul"],
        rt: [18, 333, 666, 2664, 2, 15600, 1, 15080, 28016],
        hd: [20, 103, 113.3, 35349.6, 3, 28080, 2, 36192, 64272, 28922.4],
    },
    {
        nome: "SUL", ordem: 2,
        municipios: ["Pelotas", "Rio Grande", "Capão do Leão", "Arroio do Padre", "Cerrito", "Morro Redondo", "Pedro Osório", "Turuçu", "São José do Norte", "Canguçu", "São Lourenço do Sul", "Amaral Ferrador", "Arroio Grande", "Jaguarão", "Herval", "Piratini", "Pinheiro Machado", "Pedras Altas", "Santana da Boa Vista", "Santa Vitória do Palmar", "Chuí", "Bagé", "Candiota", "Aceguá", "Hulha Negra", "Lavras do Sul", "Dom Pedrito"],
        rt: [19, 897, 1794, 7176, 2, 15600, 1, 15080, 23504],
        hd: [17, 156, 171.6, 53539.2, 4, 37440, 2, 36192, 73632, 20092.800000000003],
    },
    {
        nome: "SERRA", ordem: 3,
        municipios: ["Caxias do Sul", "Nova Petrópolis", "Canela", "Gramado", "Picada Café", "Linha Nova", "Jaquirana", "Campestre da Serra", "Muitos Capões", "Monte Alegre dos Campos", "Vacaria", "Bom Jesus", "Esmeralda", "Pinhal da Serra", "São José dos Ausentes", "Bento Gonçalves", "Vila Flores", "Carlos Barbosa", "Monte Belo do Sul", "Pinto Bandeira", "Garibaldi", "Guabiju", "Fagundes Varela", "Veranópolis", "Guaporé", "Protásio Alves", "Nova Araçá", "Coronel Pilar", "Vista Alegre do Prata", "Cotiporã", "Boa Vista do Sul", "Paraí", "Santa Tereza", "União da Serra", "Nova Bassano", "São Jorge", "Nova Prata", "Flores da Cunha", "Farroupilha", "Nova Pádua", "São Marcos", "Antônio Prado", "Feliz", "Nova Roma do Sul", "Alto Feliz", "São Vendelino", "Ipê", "Vale Real", "Bom Princípio"],
        rt: [28, 289, 578, 2312, 2, 15600, 1, 15080, 28368],
        hd: [14, 93, 102.3, 31917.6, 3, 28080, 2, 36192, 64272, 32354.4],
    },
    {
        nome: "NORTE", ordem: 4,
        municipios: ["Cristal do Sul", "Erval Seco", "Pinhal", "Frederico Westphalen", "Alpestre", "Caiçara", "Seberi", "Liberato Salzano", "Pinheirinho do Vale", "Vicente Dutra", "Rodeio Bonito", "Palmitinho", "Ametista do Sul", "Esperança do Sul", "Vista Alegre", "Iraí", "Taquaruçu do Sul", "Planalto", "Novo Tiradentes", "Derrubadas", "Tenente Portela", "Três Passos", "Vista Gaúcha", "Barra do Guarita", "Bom Progresso", "Tiradentes do Sul", "Erechim", "Estação", "Gaurama", "Erebango", "Benjamin Constant do Sul", "Áurea", "Floriano Peixoto", "Carlos Gomes", "Barra do Rio Azul", "Viadutos", "Barão de Cotegipe", "Jacutinga", "Getúlio Vargas", "Quatro Irmãos", "Aratiba", "Erval Grande", "Marcelino Ramos", "Charrua", "Entre Rios do Sul", "Campinas do Sul", "Centenário", "Três Arroios", "Severiano de Almeida", "Mariano Moro", "Nonoai", "Itatiba do Sul", "Faxinalzinho", "Rio dos Índios", "São Valentim", "Cruzaltense", "Ipiranga do Sul", "Paulo Bento", "Ponte Preta", "Passo Fundo", "Pontão", "Ciríaco", "São Domingos do Sul", "Sertão", "Casca", "Lagoa dos Três Cantos", "Coxilha", "Mato Castelhano", "Nicolau Vergueiro", "Santo Antônio do Palma", "Marau", "Montauri", "Carazinho", "Gentil", "Victor Graeff", "Serafina Corrêa", "Vanini", "Vila Maria", "Nova Alvorada", "Camargo", "Não-Me-Toque", "Ernestina", "David Canabarro", "Muliterno", "Santo Antônio do Planalto", "Coqueiros do Sul", "Almirante Tamandaré do Sul", "Paim Filho", "São João da Urtiga", "Tapejara", "Barracão", "Ibiaçá", "Maximiliano de Almeida", "Vila Lângaro", "Água Santa", "Machadinho", "Santo Expedito do Sul", "Sananduva", "São José do Ouro", "Ibiraiaras", "Cacique Doble", "André da Rocha", "Santa Cecília do Sul", "Caseiros", "Lagoa Vermelha", "Tupanci do Sul", "Capão Bonito do Sul", "Tio Hugo", "Tapera", "Barros Cassal", "Espumoso", "Itapuca", "Mormaço", "Campos Borges", "Fontoura Xavier", "Lagoão", "Soledade", "Arvorezinha", "Ibirapuitã", "Alto Alegre", "Tunas", "Jaboticaba", "Chapada", "Sarandi", "Ronda Alta", "Novo Barreiro", "Barra Funda", "Constantina", "Rondinha", "Novo Xingu", "Cerro Grande", "Engenho Velho", "Lajeado do Bugre", "Palmeira das Missões", "Gramado dos Loureiros", "Nova Boa Vista", "Coronel Bicaco", "Redentora", "Trindade do Sul", "Dois Irmãos das Missões", "Boa Vista das Missões", "Três Palmeiras", "Braga", "Miraguaí", "Sagrada Família", "São José das Missões", "São Pedro das Missões"],
        rt: [111, 1138, 2276, 9104, 2, 15600, 1, 15080, 21576],
        hd: [76, 276, 303.6, 94723.20000000001, 18, 168480, 9, 162864, 331344, 236620.8],
    },
    {
        nome: "MISSIONEIRA", ordem: 5,
        municipios: ["Eugênio de Castro", "Entre-Ijuís", "Bossoroca", "Guarani das Missões", "Sete de Setembro", "Santo Ângelo", "Santo Antônio das Missões", "Caibaté", "Salvador das Missões", "Cerro Largo", "Rolador", "Garruchos", "Ubiretama", "São Pedro do Butiá", "São Miguel das Missões", "Vitória das Missões", "São Nicolau", "Roque Gonzales", "Pirapó", "Dezesseis de Novembro", "Mato Queimado", "Porto Xavier", "São Borja", "São Luiz Gonzaga", "Colorado", "Quinze de Novembro", "Saldanha Marinho", "Cruz Alta", "Selbach", "Boa Vista do Cadeado", "Boa Vista do Incra", "Ibirubá", "Santa Bárbara do Sul", "Fortaleza dos Valos", "Jacuizinho", "Salto do Jacuí", "Ijuí", "Ajuricaba", "Inhacorá", "Chiapetta", "Augusto Pestana", "Condor", "Panambi", "Campo Novo", "Catuípe", "São Martinho", "Coronel Barros", "Santo Augusto", "Jóia", "Sede Nova", "São Valério do Sul", "Bozano", "Nova Ramada", "Humaitá", "Pejuçara", "Crissiumal", "Santa Rosa", "São José do Inhacorá", "Três de Maio", "Tucunduva", "Santo Cristo", "São Paulo das Missões", "Giruá", "Doutor Maurício Cardoso", "Tuparendi", "Independência", "Horizontina", "Campina das Missões", "Cândido Godói", "Alecrim", "Boa Vista do Buricá", "Porto Vera Cruz", "Nova Candelária", "Senador Salgado Filho", "Novo Machado", "Porto Mauá", "Porto Lucena", "Alegria"],
        rt: [54, 741, 1482, 5928, 2, 15600, 1, 15080, 24752],
        hd: [43, 190, 209, 65208, 8, 74880, 4, 72384, 147264, 82056],
    },
    {
        nome: "METROPOLITANA", ordem: 6,
        municipios: ["Dom Pedro de Alcântara", "Três Cachoeiras", "Terra de Areia", "Maquiné", "Itati", "Xangri-lá", "Capão da Canoa", "Três Forquilhas", "Arroio do Sal", "Morrinhos do Sul", "Torres", "Mampituba", "Santo Antônio da Patrulha", "Caraá", "Capivari do Sul", "Osório", "Palmares do Sul", "Balneário Pinhal", "Tramandaí", "Cidreira", "Imbé", "Mostardas", "Tavares", "Parobé", "Igrejinha", "Taquara", "Riozinho", "Três Coroas", "Rolante", "São Francisco de Paula", "Cambará do Sul", "São Leopoldo", "Araricá", "Novo Hamburgo", "Estância Velha", "Campo Bom", "Dois Irmãos", "Nova Hartz", "Ivoti", "Portão", "Sapiranga", "Lindolfo Collor", "São José do Hortêncio", "Presidente Lucena", "Morro Reuter", "Santa Maria do Herval", "Canoas", "Esteio", "Sapucaia do Sul", "Nova Santa Rita", "Capela de Santana", "Maratá", "Harmonia", "Montenegro", "Triunfo", "Pareci Novo", "Tupandi", "São Sebastião do Caí", "Tabaí", "Brochier", "Barão", "Salvador do Sul", "São José do Sul", "São Pedro da Serra", "Guaíba", "Eldorado do Sul", "Charqueadas", "Mariana Pimentel", "Barra do Ribeiro", "Arroio dos Ratos", "General Câmara", "Butiá", "Sertão Santana", "Chuvisca", "Minas do Leão", "Dom Feliciano", "São Jerônimo", "Barão do Triunfo", "Sentinela do Sul", "Tapes", "Camaquã", "Cristal", "Arambaré", "Cerro Grande do Sul", "Porto Alegre", "Cachoeirinha", "Alvorada", "Gravataí", "Viamão", "Glorinha"],
        rt: [65, 1465, 2930, 11720, 2, 15600, 1, 15080, 18960],
        hd: [17, 140, 154, 48048, 6, 56160, 3, 54288, 110448, 62400],
    },
    {
        nome: "CENTRO-OESTE", ordem: 7,
        municipios: ["Santa Maria", "Itaara", "Silveira Martins", "Restinga Sêca", "São João do Polêsine", "Faxinal do Soturno", "Dilermando de Aguiar", "Ivorá", "Nova Palma", "Dona Francisca", "Formigueiro", "São Martinho da Serra", "São Pedro do Sul", "Toropi", "Agudo", "São Sepé", "Pinhal Grande", "Paraíso do Sul", "Quevedos", "Júlio de Castilhos", "Vila Nova do Sul", "Tupanciretã", "Capão do Cipó", "Jaguari", "Nova Esperança do Sul", "Mata", "Jari", "Cacequi", "São Vicente do Sul", "Santiago", "Itacurubi", "São Francisco de Assis", "Unistalda", "Uruguaiana", "Alegrete", "São Gabriel", "Rosário do Sul", "Maçambará", "Manoel Viana", "Barra do Quaraí", "Itaqui", "Santa Margarida do Sul", "Quaraí", "Sant'Ana do Livramento"],
        rt: [33, 870, 1740, 6960, 2, 15600, 1, 15080, 23720],
        hd: [25, 152, 167.2, 52166.399999999994, 4, 37440, 2, 36192, 73632, 21465.600000000006],
    },
];

export class CusteioProjecaoRS1700000073000 implements MigrationInterface {
    name = "CusteioProjecaoRS1700000073000";

    async up(queryRunner: QueryRunner): Promise<void> {
        for (const m of MACROS) {
            await queryRunner.query(
                `INSERT INTO "custeio_projecao" (
                    "uf","macrorregiao","ordem","municipios",
                    "rt_n_acima50","rt_pacientes","rt_pessoas","rt_viagens","rt_vans","rt_cap_vans","rt_micros","rt_cap_micros","rt_saldo",
                    "hd_n_acima50","hd_pacientes","hd_pessoas","hd_viagens","hd_vans","hd_cap_vans","hd_micros","hd_cap_micros","hd_cap_total","hd_saldo"
                ) VALUES ('RS',$1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
                ON CONFLICT ("uf","macrorregiao") DO NOTHING`,
                [m.nome, m.ordem, JSON.stringify(m.municipios), ...m.rt, ...m.hd],
            );
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "custeio_projecao" WHERE "uf" = 'RS'`);
    }
}
