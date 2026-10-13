import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seed do custeio do transporte sanitário: AM, BA, PR, RS e PB (planilha "Transporte Sanitário", abas "<UF> - Novo").
 *
 * As planilhas informam só a FAIXA de distância (não o km), então dist_rt/dist_hd ficam nulos e a faixa
 * é gravada em faixa_rt/faixa_hd (rótulos iguais aos de premissas.ts do front).
 * rt = pacientes de radioterapia SEM acompanhantes (a planilha traz o valor x2); hd = pacientes de hemodiálise.
 * Nº de veículos só é gravado quando a aba informa (AM); nos demais fica nulo.
 * RS: os valores de RT da planilha divergem das próprias faixas em ~37 linhas; a faixa (conferida com a aba
 * RS - AUX) foi mantida e o valor é recalculado a partir dela.
 * Só insere a UF se ela ainda não tiver registros.
 */
type Linha = [nome: string, rt: number, hd: number, faixaRt: string | null, faixaHd: string | null];
interface SeedResponsavel {
    macro: string;
    municipio: string;
    gestorHd: string | null;
    tipo: string | null;
    tipoHd: string | null;
    nVeiculos: number | null;
    refRt: string | null;
    refHd: string | null;
    atendidos: Linha[];
}

const SEEDS: Record<string, SeedResponsavel[]> = {
    AM: [
        {
            macro: "Médio Amazonas", municipio: "Itacoatiara", gestorHd: null,
            tipo: "Van + Ambulância", tipoHd: "Micro-ônibus", nVeiculos: 3,
            refRt: "Manaus", refHd: "Manaus",
            atendidos: [
            ["Itacoatiara", 78, 90, "201 - 300", "> 151"],
            ["Itapiranga", 8, 9, "301 - 400", "> 151"],
            ["Silves", 9, 10, "301 - 400", "> 151"],
            ],
        },
        {
            macro: "Rio Madeira", municipio: "Humaitá", gestorHd: null,
            tipo: "Van", tipoHd: "Van", nVeiculos: 2,
            refRt: "Porto Velho/RO", refHd: "Porto Velho/RO",
            atendidos: [
            ["Humaitá", 44, 51, "201 - 300", "> 151"],
            ["Apuí", 16, 19, "> 401", "> 151"],
            ["Manicoré (Matupi)", 41, 48, "> 401", "> 151"],
            ],
        },
        {
            macro: "Rio Purus", municipio: "Boca do Acre", gestorHd: null,
            tipo: "Ambulância", tipoHd: null, nVeiculos: 1,
            refRt: "Rio Branco/AC", refHd: "Rio Branco/AC",
            atendidos: [
            ["Boca do Acre", 27, 0, "201 - 300", null],
            ],
        },
        {
            macro: "Rio Purus", municipio: "Lábrea", gestorHd: null,
            tipo: "Ambulância", tipoHd: "Van", nVeiculos: 2,
            refRt: "Porto Velho/RO", refHd: "Porto Velho/RO",
            atendidos: [
            ["Lábrea", 35, 41, "> 401", "> 151"],
            ],
        },
        {
            macro: "Rio Negro e Solimões", municipio: "Manacapuru", gestorHd: null,
            tipo: "Ambulância", tipoHd: "Micro-ônibus", nVeiculos: 2,
            refRt: "Manaus", refHd: "Manaus",
            atendidos: [
            ["Caapiranga", 10, 13, "50 - 200", "> 151"],
            ["Beruri", 16, 19, "201 - 300", "> 151"],
            ["Anamã", 8, 9, "201 - 300", "> 151"],
            ["Manacapuru", 77, 91, "50 - 200", "101 - 150"],
            ],
        },
        {
            macro: "Manaus, Entorno e Alto Rio Negro", municipio: "Manaquiri", gestorHd: null,
            tipo: "Ambulância", tipoHd: "Van", nVeiculos: 2,
            refRt: "Manaus", refHd: "Manaus",
            atendidos: [
            ["Careiro", 23, 28, "50 - 200", "101 - 150"],
            ["Manaquiri", 12, 16, "50 - 200", "> 151"],
            ],
        },
        {
            macro: "Manaus, Entorno e Alto Rio Negro", municipio: "Presidente Figueiredo", gestorHd: null,
            tipo: null, tipoHd: "Van", nVeiculos: 1,
            refRt: "Manaus", refHd: "Manaus",
            atendidos: [
            ["Presidente Figueiredo", 0, 27, null, "101 - 150"],
            ["Manaus", 0, 1322, null, "< 50 km"],
            ],
        },
    ],
    BA: [
        {
            macro: "Centro Leste", municipio: "Serrinha", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Feira de Santana e Salvador", refHd: null,
            atendidos: [
            ["Serrinha", 97, 0, "50 - 200", null],
            ["Teofilândia", 25, 0, "50 - 200", null],
            ["Araci", 62, 0, "201 - 300", null],
            ["Biritinga", 20, 0, "201 - 300", null],
            ["Monte Santo", 62, 0, "301 - 400", null],
            ["Quijingue", 33, 0, "301 - 400", null],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Itaberaba", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Feira de Santana e Salvador", refHd: null,
            atendidos: [
            ["Itaberaba", 82, 0, "201 - 300", null],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Conceição do Coité", gestorHd: "Retirolândia",
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Feira de Santana e Salvador", refHd: "Serrinha",
            atendidos: [
            ["São Domingos", 11, 8, "50 - 200", "51 - 100"],
            ["Retirolândia", 18, 12, "201 - 300", "51 - 100"],
            ["Conceição do Coité", 87, 0, "201 - 300", null],
            ["Queimadas", 34, 0, "201 - 300", null],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Valente", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Feira de Santana e Salvador", refHd: "Serrinha",
            atendidos: [
            ["Valente", 31, 21, "201 - 300", "51 - 100"],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Cansanção", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: "Euclides da Cunha",
            atendidos: [
            ["Nordestina", 24, 17, "301 - 400", "101 - 150"],
            ["Cansanção", 0, 33, null, "51 - 100"],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Ipirá", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Feira de Santana",
            atendidos: [
            ["Ipirá", 0, 50, null, "51 - 100"],
            ["Serra Preta", 0, 15, null, "51 - 100"],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Mundo Novo", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Feira de Santana",
            atendidos: [
            ["Mundo Novo", 0, 15, null, "> 151"],
            ["Baixa Grande", 0, 17, null, "101 - 150"],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Nova Fátima", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Feira de Santana",
            atendidos: [
            ["Nova Fátima", 0, 7, null, "101 - 150"],
            ["Gavião", 0, 3, null, "101 - 150"],
            ["Pé de Serra", 0, 12, null, "101 - 150"],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Macajuba", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itaberaba",
            atendidos: [
            ["Macajuba", 0, 9, null, "51 - 100"],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Ibitiara", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Seabra",
            atendidos: [
            ["Ibitiara", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "Centro Leste", municipio: "Santaluz", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Serrinha",
            atendidos: [
            ["Santaluz", 0, 32, null, "51 - 100"],
            ],
        },
        {
            macro: "Centro Norte", municipio: "Jacobina", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Jacobina", 98, 0, "301 - 400", null],
            ["Mirangaba", 21, 0, "301 - 400", null],
            ],
        },
        {
            macro: "Centro Norte", municipio: "Capim Grosso", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: "Jacobina",
            atendidos: [
            ["Capim Grosso", 44, 30, "201 - 300", "51 - 100"],
            ["Quixabeira", 13, 9, "201 - 300", "51 - 100"],
            ["São José do Jacuípe", 14, 9, "201 - 300", "101 - 150"],
            ["Várzea da Roça", 0, 12, null, "101 - 150"],
            ],
        },
        {
            macro: "Centro Norte", municipio: "Jacobina", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Caem", 14, 0, "301 - 400", null],
            ],
        },
        {
            macro: "Centro Norte", municipio: "Irecê", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Irecê", 94, 0, "> 401", null],
            ],
        },
        {
            macro: "Centro Norte", municipio: "Xique-xique", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: "Irecê",
            atendidos: [
            ["Xique-xique", 58, 40, "> 401", "101 - 150"],
            ["Presidente Dutra", 20, 13, "> 401", "< 50 km"],
            ["Central", 0, 14, null, "< 50 km"],
            ],
        },
        {
            macro: "Centro Norte", municipio: "Morro do Chapéu", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jacobina",
            atendidos: [
            ["Morro do Chapéu", 0, 30, null, "101 - 150"],
            ["Várzea Nova", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "Centro Norte", municipio: "Mairi", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jacobina",
            atendidos: [
            ["Mairi", 0, 15, null, "101 - 150"],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Porto Seguro", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Teixeira de Freitas", refHd: "Eunápolis",
            atendidos: [
            ["Porto Seguro", 210, 139, "201 - 300", "51 - 100"],
            ["Central", 21, 0, "> 401", null],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Eunápolis", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Teixeira de Freitas", refHd: null,
            atendidos: [
            ["Eunápolis", 123, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Itamaraju", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Teixeira de Freitas", refHd: "Teixeira de Freitas",
            atendidos: [
            ["Itamaraju", 74, 51, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Belmonte", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Eunápolis",
            atendidos: [
            ["Belmonte", 0, 17, null, "101 - 150"],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Santa Cruz do Cabrália", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Eunápolis",
            atendidos: [
            ["Santa Cruz do Cabrália", 0, 25, null, "51 - 100"],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Mucuri", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Teixeira de Freitas",
            atendidos: [
            ["Mucuri", 0, 28, null, "101 - 150"],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Nova Viçosa", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Teixeira de Freitas",
            atendidos: [
            ["Nova Viçosa", 0, 31, null, "101 - 150"],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Prado", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Teixeira de Freitas",
            atendidos: [
            ["Prado", 0, 31, null, "51 - 100"],
            ],
        },
        {
            macro: "Extremo Sul", municipio: "Amargosa", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Teixeira de Freitas",
            atendidos: [
            ["Amargosa", 0, 32, null, "> 151"],
            ],
        },
        {
            macro: "Leste", municipio: "Santo Antônio de Jesus", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Santo Antônio de Jesus", 125, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Leste", municipio: "Santo Amaro", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Santo Amaro", 68, 0, "50 - 200", null],
            ["São Francisco do Conde", 48, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Leste", municipio: "Cruz das Almas", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Cruz das Almas", 74, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Leste", municipio: "Presidente Tancredo Neves", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Santo Antônio de Jesus",
            atendidos: [
            ["Presidente Tancredo Neves", 0, 24, null, "51 - 100"],
            ],
        },
        {
            macro: "Leste", municipio: "Itatim", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Santo Estêvão",
            atendidos: [
            ["Itatim", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "Nordeste", municipio: "Alagoinhas", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Alagoinhas", 166, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Nordeste", municipio: "Ribeira do Pombal", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Lagarto (Sergipe)", refHd: null,
            atendidos: [
            ["Ribeira do Pombal", 68, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Nordeste", municipio: "Tucano", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Lagarto (Sergipe)", refHd: null,
            atendidos: [
            ["Tucano", 63, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Nordeste", municipio: "Esplanada", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Alagoinhas",
            atendidos: [
            ["Esplanada", 0, 29, null, "51 - 100"],
            ],
        },
        {
            macro: "Nordeste", municipio: "Itapicuru", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Alagoinhas",
            atendidos: [
            ["Itapicuru", 0, 29, null, "101 - 150"],
            ],
        },
        {
            macro: "Nordeste", municipio: "Rio Real", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Alagoinhas",
            atendidos: [
            ["Rio Real", 0, 31, null, "101 - 150"],
            ],
        },
        {
            macro: "Nordeste", municipio: "Olindina", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Ribeira do Pombal",
            atendidos: [
            ["Olindina", 0, 20, null, "51 - 100"],
            ],
        },
        {
            macro: "Norte", municipio: "Paulo Afonso", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Lagarto (Sergipe)", refHd: null,
            atendidos: [
            ["Paulo Afonso", 136, 0, "201 - 300", null],
            ],
        },
        {
            macro: "Norte", municipio: "Senhor do Bomfim", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Juazeiro", refHd: null,
            atendidos: [
            ["Senhor do Bomfim", 91, 0, "> 401", null],
            ],
        },
        {
            macro: "Norte", municipio: "Casa Nova", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Juazeiro", refHd: "Juazeiro",
            atendidos: [
            ["Casa Nova", 92, 62, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "Norte", municipio: "Remanso", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Juazeiro",
            atendidos: [
            ["Remanso", 0, 35, null, "> 151"],
            ["Campo Alegre de Lourdes", 0, 26, null, "> 151"],
            ],
        },
        {
            macro: "Norte", municipio: "Curaçá", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Juazeiro",
            atendidos: [
            ["Curaçá", 0, 30, null, "51 - 100"],
            ],
        },
        {
            macro: "Norte", municipio: "Pilão Arcado", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Juazeiro",
            atendidos: [
            ["Pilão Arcado", 0, 31, null, "> 151"],
            ],
        },
        {
            macro: "Norte", municipio: "Jeremoabo", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Paulo Afonso",
            atendidos: [
            ["Jeremoabo", 0, 33, null, "51 - 100"],
            ["Santa Brígida", 0, 13, null, "51 - 100"],
            ["Pedro Alexandre", 0, 12, null, "101 - 150"],
            ],
        },
        {
            macro: "Oeste", municipio: "Barreiras", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Barreiras", 194, 0, "> 401", null],
            ],
        },
        {
            macro: "Oeste", municipio: "Luís Eduardo Magalhães", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: "Barreiras",
            atendidos: [
            ["Luís Eduardo Magalhães", 134, 89, "> 401", "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "Bom Jesus da Lapa", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Salvador", refHd: null,
            atendidos: [
            ["Bom Jesus da Lapa", 83, 0, "> 401", null],
            ],
        },
        {
            macro: "Oeste", municipio: "Santa Rita de Cássia", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Barreiras",
            atendidos: [
            ["Santa Rita de Cássia", 0, 24, null, "> 151"],
            ],
        },
        {
            macro: "Oeste", municipio: "Baianópolis", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Barreiras",
            atendidos: [
            ["Baianópolis", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "Barra", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Irecê",
            atendidos: [
            ["Barra*", 0, 45, null, "> 151"],
            ],
        },
        {
            macro: "Oeste", municipio: "Brotas de Macaúbas", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Seabra",
            atendidos: [
            ["Brotas de Macaúbas*", 0, 10, null, "101 - 150"],
            ],
        },
        {
            macro: "Oeste", municipio: "Ibotirama", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Barreiras",
            atendidos: [
            ["Ibotirama", 0, 23, null, "> 151"],
            ],
        },
        {
            macro: "Oeste", municipio: "Santa Maria da Vitória", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Bom Jesus da Lapa",
            atendidos: [
            ["Santa Maria da Vitória", 0, 34, null, "101 - 150"],
            ["São Félix do Coribe", 0, 13, null, "101 - 150"],
            ],
        },
        {
            macro: "Oeste", municipio: "Correntina", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Bom Jesus da Lapa",
            atendidos: [
            ["Correntina", 0, 29, null, "> 151"],
            ],
        },
        {
            macro: "Oeste", municipio: "Livramento de Nossa Senhora", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Brumado",
            atendidos: [
            ["Livramento de Nossa Senhora", 0, 39, null, "51 - 100"],
            ["Dom Basílio", 0, 10, null, "51 - 100"],
            ["Jussiape", 0, 7, null, "101 - 150"],
            ["Rio de Contas", 0, 11, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "Barra do Estiva", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Brumado",
            atendidos: [
            ["Barra do Estiva", 0, 23, null, "101 - 150"],
            ["Ibicoara", 0, 19, null, "101 - 150"],
            ],
        },
        {
            macro: "Oeste", municipio: "Boquira", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Brumado",
            atendidos: [
            ["Boquira", 0, 17, null, "> 151"],
            ],
        },
        {
            macro: "Oeste", municipio: "Caculé", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Brumado",
            atendidos: [
            ["Caculé", 0, 20, null, "51 - 100"],
            ["Ibiassucê", 0, 9, null, "51 - 100"],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Guanambi", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Vitória da Conquista", refHd: null,
            atendidos: [
            ["Guanambi", 110, 0, "201 - 300", null],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Brumado", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Vitória da Conquista", refHd: null,
            atendidos: [
            ["Brumado", 84, 0, "50 - 200", null],
            ["Aracatu", 18, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Itapetinga", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Vitória da Conquista", refHd: null,
            atendidos: [
            ["Itapetinga", 80, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Carinhanha", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guanambi",
            atendidos: [
            ["Lagoa Real", 0, 12, null, "51 - 100"],
            ["Carinhanha", 0, 25, null, "> 151"],
            ["Malhada", 0, 13, null, "101 - 150"],
            ["Iuiú", 0, 10, null, "51 - 100"],
            ["Feira da Mata", 0, 6, null, "> 151"],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Urandi", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guanambi",
            atendidos: [
            ["Urandi", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Riacho do Santana", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Bom Jesus da Lapa",
            atendidos: [
            ["Riacho do Santana", 0, 26, null, "> 151"],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Itarantim", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itapetinga",
            atendidos: [
            ["Itarantim", 0, 14, null, "51 - 100"],
            ["Maiquinique", 0, 8, null, "51 - 100"],
            ["Potiraguá", 0, 9, null, "51 - 100"],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Poções", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Vitória da Conquista",
            atendidos: [
            ["Poções", 0, 42, null, "51 - 100"],
            ["Planalto", 0, 20, null, "< 50 km"],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Cândido Sales", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Vitória da Conquista",
            atendidos: [
            ["Cândido Sales", 0, 22, null, "51 - 100"],
            ],
        },
        {
            macro: "Sudoeste", municipio: "Encruzilhada", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Vitória da Conquista",
            atendidos: [
            ["Encruzilhada", 0, 17, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Jequié", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Itabuna", refHd: null,
            atendidos: [
            ["Jequié", 196, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Sul", municipio: "Ipiaú", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Itabuna", refHd: "Jequié",
            atendidos: [
            ["Ipiaú", 49, 33, "50 - 200", "51 - 100"],
            ["Ibirataia", 24, 17, "50 - 200", "51 - 100"],
            ["Dário Meira", 14, 0, "50 - 200", null],
            ["Barra do Rocha", 8, 0, "50 - 200", null],
            ["Itagibá", 18, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Sul", municipio: "Valença", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Itabuna", refHd: null,
            atendidos: [
            ["Valença", 108, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Sul", municipio: "Itacaré", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Ilhéus",
            atendidos: [
            ["Itacaré", 0, 24, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Camacan", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itabuna",
            atendidos: [
            ["Camacan", 0, 19, null, "51 - 100"],
            ["Jussari", 0, 6, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Ibirapitanga", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itabuna",
            atendidos: [
            ["Ibirapitanga", 0, 22, null, "51 - 100"],
            ["Aurelino Leal", 0, 10, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Jaguaquara", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jequié",
            atendidos: [
            ["Jaguaquara", 0, 40, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Maracás", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jequié",
            atendidos: [
            ["Maracás", 0, 23, null, "51 - 100"],
            ["Itiruçu", 0, 10, null, "51 - 100"],
            ["Lajedo do Tabocal", 0, 7, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Itagi", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jequié",
            atendidos: [
            ["Itagi", 0, 12, null, "< 50 km"],
            ],
        },
        {
            macro: "Sul", municipio: "Gandu", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Valença",
            atendidos: [
            ["Gandu", 0, 28, null, "51 - 100"],
            ["Nova Ibiá", 0, 6, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Wenceslau Guimarães", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Valença",
            atendidos: [
            ["Wenceslau Guimarães", 0, 22, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Riachão do Jacuípe", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Feira de Santana",
            atendidos: [
            ["Riachão do Jacuípe", 0, 29, null, "51 - 100"],
            ["Ichú", 0, 6, null, "51 - 100"],
            ["Candeal", 0, 7, null, "51 - 100"],
            ["Pintadas", 0, 9, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Pintadas", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Feira de Santana",
            atendidos: [
            ["Capela do Alto Alegre", 0, 10, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Itaetê", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itaberaba",
            atendidos: [
            ["Itaetê", 0, 12, null, "101 - 150"],
            ["Marcionílio Souza", 0, 8, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Piatã", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Seabra",
            atendidos: [
            ["Piatã", 0, 18, null, "51 - 100"],
            ["Abaíra", 0, 7, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "América Dourada", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Irecê",
            atendidos: [
            ["América Dourada", 0, 13, null, "< 50 km"],
            ],
        },
        {
            macro: "Sul", municipio: "Barro Alto", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Irecê",
            atendidos: [
            ["Barro Alto", 0, 12, null, "51 - 100"],
            ["Canarana", 0, 21, null, "< 50 km"],
            ],
        },
        {
            macro: "Sul", municipio: "Piritiba", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jacobina",
            atendidos: [
            ["Piritiba", 0, 15, null, "51 - 100"],
            ["Miguel Calmon", 0, 21, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Itapebi", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Eunápolis",
            atendidos: [
            ["Itapebi", 0, 8, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Guaratinga", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Eunápolis",
            atendidos: [
            ["Guaratinga", 0, 17, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Caravelas", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Teixeira de Freitas",
            atendidos: [
            ["Caravelas", 0, 18, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Medeiros Neto", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Teixeira de Freitas",
            atendidos: [
            ["Medeiros Neto", 0, 19, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Mutuípe", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Santo Antônio de Jesus",
            atendidos: [
            ["Mutuípe", 0, 18, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Acajutiba", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Alagoinhas",
            atendidos: [
            ["Acajutiba", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Adustina", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Ribeira do Pombal",
            atendidos: [
            ["Adustina", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Antas", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Ribeira do Pombal",
            atendidos: [
            ["Antas", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Sento Sé", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Juazeiro",
            atendidos: [
            ["Sento Sé", 0, 33, null, "> 151"],
            ],
        },
        {
            macro: "Sul", municipio: "Uauá", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Juazeiro",
            atendidos: [
            ["Uauá", 0, 21, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Abaré", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Paulo Afonso",
            atendidos: [
            ["Abaré", 0, 15, null, "> 151"],
            ["Chorrochó", 0, 9, null, "> 151"],
            ["Macururé", 0, 7, null, "101 - 150"],
            ["Rodelas", 0, 9, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Cristópolis", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Barreiras",
            atendidos: [
            ["Cristópolis", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Formosa do Rio Preto", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Barreiras",
            atendidos: [
            ["Formosa do Rio Preto", 0, 22, null, "> 151"],
            ],
        },
        {
            macro: "Sul", municipio: "Oliveira dos Brejinhos", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Seabra",
            atendidos: [
            ["Oliveira dos Brejinhos", 0, 19, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Coribe", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Bom Jesus da Lapa",
            atendidos: [
            ["Coribe", 0, 12, null, "> 151"],
            ],
        },
        {
            macro: "Sul", municipio: "Santana", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Bom Jesus da Lapa",
            atendidos: [
            ["Santana", 0, 22, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Macaúbas", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Brumado",
            atendidos: [
            ["Macaúbas", 0, 36, null, "> 151"],
            ["Paramirim", 0, 18, null, "101 - 150"],
            ["Rio do Pires", 0, 9, null, "> 151"],
            ["Érico Cardoso", 0, 9, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Tanhaçu", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Brumado",
            atendidos: [
            ["Tanhaçu", 0, 19, null, "51 - 100"],
            ["Ituaçu", 0, 15, null, "51 - 100"],
            ["Contendas do Sincorá", 0, 3, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Igaporã", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guanambi",
            atendidos: [
            ["Igaporã", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Tanque Novo", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guanambi",
            atendidos: [
            ["Tanque novo", 0, 15, null, "101 - 150"],
            ["Botuporã", 0, 10, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Nova Canaã", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itapetinga",
            atendidos: [
            ["Nova Canaã", 0, 12, null, "51 - 100"],
            ["Iguaí", 0, 19, null, "51 - 100"],
            ["Ibicuí", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Belo Campo", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itapetinga",
            atendidos: [
            ["Belo Campo", 0, 17, null, "> 151"],
            ["Tremedal", 0, 14, null, "> 151"],
            ],
        },
        {
            macro: "Sul", municipio: "Condeúba", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Vitória da Conquista",
            atendidos: [
            ["Condeúba", 0, 15, null, "> 151"],
            ["Cordeiros", 0, 7, null, "> 151"],
            ["Piripá", 0, 8, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Canavieiras", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Ilhéus",
            atendidos: [
            ["Canavieiras", 0, 29, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Santa Cruz da Vitória", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Itabuna",
            atendidos: [
            ["Santa Cruz da Vitória", 0, 4, null, "51 - 100"],
            ["Ibicaraí", 0, 19, null, "< 50 km"],
            ["Itaju do Colônia", 0, 6, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Brejões", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jequié",
            atendidos: [
            ["Brejões", 0, 11, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Santa Inês", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jequié",
            atendidos: [
            ["Santa Inês", 0, 9, null, "51 - 100"],
            ],
        },
        {
            macro: "Sul", municipio: "Iramaia", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Jequié",
            atendidos: [
            ["Iramaia", 0, 10, null, "101 - 150"],
            ],
        },
        {
            macro: "Sul", municipio: "Camamu", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Valença",
            atendidos: [
            ["Camamu", 0, 26, null, "51 - 100"],
            ["Igrapiúna", 0, 11, null, "51 - 100"],
            ],
        },
    ],
    PR: [
        {
            macro: "Leste", municipio: "Antonina", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Paranaguá",
            atendidos: [
            ["Antonina", 0, 14, null, "51 - 100"],
            ["Morretes", 0, 15, null, "< 50 km"],
            ],
        },
        {
            macro: "Leste", municipio: "Guaratuba", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Paranaguá",
            atendidos: [
            ["Guaratuba", 0, 34, null, "51 - 100"],
            ["Matinhos", 0, 30, null, "< 50 km"],
            ["Pontal do Paraná", 0, 24, null, "< 50 km"],
            ],
        },
        {
            macro: "Leste", municipio: "Adrianópolis", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande do Sul",
            atendidos: [
            ["Adrianópolis", 0, 6, null, "101 - 150"],
            ["Tunas do Paraná", 0, 6, null, "51 - 100"],
            ],
        },
        {
            macro: "Leste", municipio: "Campo do Tenente", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Curitiba",
            atendidos: [
            ["Campo do Tenente", 0, 7, null, "51 - 100"],
            ["Quitandinha", 0, 15, null, "51 - 100"],
            ],
        },
        {
            macro: "Leste", municipio: "Dr. Ulysses", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande do Sul",
            atendidos: [
            ["Dr. Ulysses", 0, 6, null, "> 151"],
            ["Cerro Azul", 0, 14, null, "101 - 150"],
            ],
        },
        {
            macro: "Leste", municipio: "Campina Grande do Sul", gestorHd: null,
            tipo: "Ambulância Tipo A", tipoHd: null, nVeiculos: null,
            refRt: "Curitiba", refHd: null,
            atendidos: [
            ["Campina Grande do Sul", 60.5, 0, "< 50 km", null],
            ],
        },
        {
            macro: "Leste", municipio: "Curitiba", gestorHd: null,
            tipo: "Ambulância Tipo A", tipoHd: null, nVeiculos: null,
            refRt: "Curitiba", refHd: null,
            atendidos: [
            ["Curitiba", 1297, 0, "< 50 km", null],
            ],
        },
        {
            macro: "Leste", municipio: "Imbituva", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Irati",
            atendidos: [
            ["Imbituva", 0, 25, null, "< 50 km"],
            ],
        },
        {
            macro: "Leste", municipio: "Inácio Martins", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Irati",
            atendidos: [
            ["Inácio Martins", 0, 9, null, "51 - 100"],
            ],
        },
        {
            macro: "Leste", municipio: "Irati", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Irati",
            atendidos: [
            ["Irati", 0, 46, null, "< 50 km"],
            ],
        },
        {
            macro: "Leste", municipio: "Laranjeiras do Sul", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guarapuava",
            atendidos: [
            ["Laranjeiras do Sul", 0, 26, null, "101 - 150"],
            ],
        },
        {
            macro: "Leste", municipio: "Pinhão", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guarapuava",
            atendidos: [
            ["Pinhão", 0, 25, null, "51 - 100"],
            ],
        },
        {
            macro: "Leste", municipio: "Prudentópolis", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Guarapuava", refHd: null,
            atendidos: [
            ["Prudentópolis", 75, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Leste", municipio: "Bituruna", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "União da Vitória",
            atendidos: [
            ["Bituruna", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "Leste", municipio: "São Mateus do Sul", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande do Sul", refHd: null,
            atendidos: [
            ["São Mateus do Sul", 56.5, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Leste", municipio: "União da Vitória", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande do Sul", refHd: null,
            atendidos: [
            ["União da Vitória", 76, 0, "201 - 300", null],
            ],
        },
        {
            macro: "Leste", municipio: "Curiúva", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Telêmaco Borba",
            atendidos: [
            ["Curiúva", 0, 11, null, "51 - 100"],
            ],
        },
        {
            macro: "Norte", municipio: "Apucarana", gestorHd: null,
            tipo: "Ambulância Tipo A + Van", tipoHd: null, nVeiculos: null,
            refRt: "Apucarana", refHd: "Apucarana",
            atendidos: [
            ["Apucarana", 177, 98, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "Norte", municipio: "Londrina", gestorHd: null,
            tipo: "Ambulância Tipo A + Van", tipoHd: null, nVeiculos: null,
            refRt: "Londrina", refHd: "Londrina",
            atendidos: [
            ["Londrina", 542, 298, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "Norte", municipio: "Bandeirantes", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Cornélio Procópio",
            atendidos: [
            ["Bandeirantes", 0, 24, null, "< 50 km"],
            ],
        },
        {
            macro: "Norte", municipio: "Sapopema", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Cornélio Procópio",
            atendidos: [
            ["Sapopema", 0, 6, null, "101 - 150"],
            ],
        },
        {
            macro: "Norte", municipio: "Siqueira Campos", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Santo Antônio da Platina",
            atendidos: [
            ["Siqueira Campos", 0, 19, null, "51 - 100"],
            ],
        },
        {
            macro: "Norte", municipio: "Carlópolis", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Londrina", refHd: null,
            atendidos: [
            ["Carlópolis", 26, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Norte", municipio: "Pinhalão", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Londrina", refHd: null,
            atendidos: [
            ["Pinhalão", 10, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Norte", municipio: "Mato Rico", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Ivaiporã",
            atendidos: [
            ["Mato Rico", 0, 3, null, "101 - 150"],
            ],
        },
        {
            macro: "Norte", municipio: "Santa Maria do Oeste", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Ivaiporã",
            atendidos: [
            ["Santa Maria do Oeste", 0, 9, null, "101 - 150"],
            ],
        },
        {
            macro: "Norte", municipio: "Ivaiporã", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Londrina", refHd: null,
            atendidos: [
            ["Ivaiporã", 46, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Noroeste", municipio: "Barbosa Ferraz", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campo Mourão",
            atendidos: [
            ["Barbosa Ferraz", 0, 9, null, "51 - 100"],
            ["Fênix", 0, 3, null, "51 - 100"],
            ["Quinta do Sol", 0, 3, null, "< 50 km"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Moreira Sales", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campo Mourão",
            atendidos: [
            ["Moreira Sales", 0, 9, null, "51 - 100"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Juranda", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Cascavel", refHd: null,
            atendidos: [
            ["Juranda", 10.5, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Noroeste", municipio: "Altônia", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Umuarama",
            atendidos: [
            ["Altônia", 0, 17, null, "51 - 100"],
            ["São Jorge do Patrocínio", 0, 6, null, "51 - 100"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Francisco Alves", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Umuarama",
            atendidos: [
            ["Francisco Alves", 0, 7, null, "51 - 100"],
            ["Iporã", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Ivaté", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Umuarama",
            atendidos: [
            ["Ivaté", 0, 4, null, "< 50 km"],
            ["Douradina", 0, 6, null, "51 - 100"],
            ["Maria Helena", 0, 6, null, "< 50 km"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Umuarama", gestorHd: null,
            tipo: "Ambulância Tipo A", tipoHd: null, nVeiculos: null,
            refRt: "Umuarama", refHd: null,
            atendidos: [
            ["Umuarama", 160.5, 0, "< 50 km", null],
            ],
        },
        {
            macro: "Noroeste", municipio: "Cidade Gaúcha", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Cianorte",
            atendidos: [
            ["Cidade Gaúcha", 0, 8, null, "51 - 100"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Tuneiras do Oeste", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Cianorte",
            atendidos: [
            ["Tuneiras do Oeste", 0, 7, null, "< 50 km"],
            ],
        },
        {
            macro: "Noroeste", municipio: "São Tomé", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Umuarama", refHd: null,
            atendidos: [
            ["São Tomé", 7, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Noroeste", municipio: "Cruzeiro do Sul", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Paranavaí",
            atendidos: [
            ["Cruzeiro do Sul", 0, 3, null, "51 - 100"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Porto Rico", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Paranavaí",
            atendidos: [
            ["Porto Rico", 0, 2, null, "101 - 150"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Terra Rica", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Umuarama", refHd: null,
            atendidos: [
            ["Terra Rica", 18, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Noroeste", municipio: "Astorga", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Maringá",
            atendidos: [
            ["Astorga", 0, 19, null, "51 - 100"],
            ["Iguaraçu", 0, 3, null, "< 50 km"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Mandaguari", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Maringá",
            atendidos: [
            ["Mandaguari", 0, 21, null, "< 50 km"],
            ["Sarandi", 0, 83, null, "< 50 km"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Mandaguaçu", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Maringá",
            atendidos: [
            ["Mandaguaçu", 0, 20, null, "< 50 km"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Nova Esperança", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Colorado",
            atendidos: [
            ["Nova Esperança", 0, 17, null, "51 - 100"],
            ["Uniflor", 0, 1, null, "< 50 km"],
            ["Paranacity", 0, 7, null, "< 50 km"],
            ],
        },
        {
            macro: "Noroeste", municipio: "Colorado", gestorHd: null,
            tipo: "Ambulância Tipo A", tipoHd: null, nVeiculos: null,
            refRt: "Maringá", refHd: null,
            atendidos: [
            ["Colorado", 25.5, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Oeste", municipio: "Chopinzinho", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Pato Branco",
            atendidos: [
            ["Chopinzinho", 0, 17, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "Palmas", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Pato Branco",
            atendidos: [
            ["Palmas", 0, 37, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "São João", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Pato Branco",
            atendidos: [
            ["São João", 0, 9, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "Vitorino", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Pato Branco", refHd: null,
            atendidos: [
            ["Vitorino", 13.5, 0, "< 50 km", null],
            ],
        },
        {
            macro: "Oeste", municipio: "Capanema", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Francisco Beltrão",
            atendidos: [
            ["Capanema", 0, 17, null, "101 - 150"],
            ],
        },
        {
            macro: "Oeste", municipio: "Cruzeiro do Iguaçu", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Francisco Beltrão",
            atendidos: [
            ["Cruzeiro do Iguaçu", 0, 3, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "Santo Antônio do Sudoeste", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Francisco Beltrão",
            atendidos: [
            ["Santo Antônio do Sudoeste", 0, 21, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "São Jorge D'Oeste", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Francisco Beltrão", refHd: null,
            atendidos: [
            ["São Jorge D'Oeste", 13.5, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Oeste", municipio: "Medianeira", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Foz do Iguaçu",
            atendidos: [
            ["Medianeira", 0, 36, null, "51 - 100"],
            ],
        },
        {
            macro: "Oeste", municipio: "Foz do Iguaçu", gestorHd: null,
            tipo: "Ambulância Tipo A", tipoHd: null, nVeiculos: null,
            refRt: "Foz do Iguaçu", refHd: null,
            atendidos: [
            ["Foz do Iguaçu", 343.5, 0, "< 50 km", null],
            ],
        },
        {
            macro: "Oeste", municipio: "Três Barras do Paraná", gestorHd: null,
            tipo: "Ambulância Tipo A", tipoHd: null, nVeiculos: null,
            refRt: "Cascavel", refHd: null,
            atendidos: [
            ["Três Barras do Paraná", 16, 0, "50 - 200", null],
            ],
        },
        {
            macro: "Oeste", municipio: "Assis Chateaubriand", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Toledo",
            atendidos: [
            ["Assis Chateaubriand", 0, 28, null, "< 50 km"],
            ],
        },
        {
            macro: "Oeste", municipio: "Guaíra", gestorHd: null,
            tipo: "Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Toledo",
            atendidos: [
            ["Guaíra", 0, 25, null, "101 - 150"],
            ],
        },
        {
            macro: "Oeste", municipio: "Marechal Cândido Rondon", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Toledo",
            atendidos: [
            ["Marechal Cândido Rondon", 0, 30, null, "< 50 km"],
            ],
        },
        {
            macro: "Oeste", municipio: "Toledo", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: "Cascavel", refHd: null,
            atendidos: [
            ["Toledo", 142.5, 0, "< 50 km", null],
            ],
        },
    ],
    RS: [
        {
            macro: "CENTRO-OESTE", municipio: "Pinhal Grande", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Santa Maria", refHd: "Santa Maria",
            atendidos: [
            ["Pinhal Grande", 7, 3, "50 - 200", "51 - 100"],
            ["Nova Palma", 9, 4, "50 - 200", "51 - 100"],
            ["São João do Polêsine", 4, 2, "< 50 km", "< 50 km"],
            ["Faxinal do Soturno", 10, 6, "50 - 200", "51 - 100"],
            ["São Sepé", 33, 0, "50 - 200", null],
            ["Formigueiro", 11, 6, "50 - 200", "51 - 100"],
            ["Restinga Seca", 23, 12, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "CENTRO-OESTE", municipio: "São Vicente do Sul", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Santa Maria", refHd: "Santa Maria",
            atendidos: [
            ["São Vicente do Sul", 13, 7, "50 - 200", "51 - 100"],
            ["Mata", 8, 4, "50 - 200", "51 - 100"],
            ["São Francisco de Assis", 28, 0, "50 - 200", null],
            ["Santiago", 75, 0, "50 - 200", null],
            ["Capão do Cipó", 5, 0, "201 - 300", null],
            ["Jaguari", 17, 0, "50 - 200", null],
            ["Nova Esperança do Sul", 8, 0, "50 - 200", null],
            ],
        },
        {
            macro: "CENTRO-OESTE", municipio: "Itaqui", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Uruguaiana", refHd: "Santana do Livramento e Uruguaiana/ Alegrete",
            atendidos: [
            ["Itaqui", 52, 0, "50 - 200", null],
            ["Quarai", 38, 20, "50 - 200", "101 - 150"],
            ["Manoel Viana", 11, 6, "50 - 200", "< 50 km"],
            ["Rosário do Sul", 58, 0, "201 - 300", null],
            ["Alegrete", 109, 0, "50 - 200", null],
            ["São Gabriel", 93, 0, "301 - 400", null],
            ["Santa Margarida do Sul", 5, 0, "301 - 400", null],
            ],
        },
        {
            macro: "METROPOLITANA", municipio: "Tavares", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Osório", refHd: "Porto Alegre/ Osório",
            atendidos: [
            ["Tavares", 9, 4, "50 - 200", "> 151"],
            ["Mostardas", 20, 10, "50 - 200", "> 151"],
            ["Cidreira", 27, 14, "< 50 km", "< 50 km"],
            ["Balneário Pinhal", 24, 12, "50 - 200", "51 - 100"],
            ["Capivari do Sul", 6, 3, "< 50 km", "< 50 km"],
            ["Imbé", 42, 22, "< 50 km", "< 50 km"],
            ["Tramandaí", 83, 44, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "NORTE", municipio: "Cristal", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Camaquã e Porto Alegre", refHd: "Porto Alegre/ Camaquã e Santa Cruz do Sul",
            atendidos: [
            ["Cristal", 5, 2, "< 50 km", "< 50 km"],
            ["Camaquã", 90, 48, "< 50 km", "< 50 km"],
            ["Sentinela do Sul", 9, 4, "< 50 km", "< 50 km"],
            ["Chuvisca", 8, 4, "< 50 km", "< 50 km"],
            ["Arambaré", 7, 3, "< 50 km", "< 50 km"],
            ["Charqueadas", 46, 24, "50 - 200", "101 - 150"],
            ["São Jerônimo", 29, 15, "50 - 200", "51 - 100"],
            ["General Câmara", 12, 7, "50 - 200", "51 - 100"],
            ["Arroio dos Ratos", 21, 11, "50 - 200", "101 - 150"],
            ["Butiá", 5, 2, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "MISSIONEIRA", municipio: "São Miguel das Missões", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Santo Ângelo", refHd: "Ijuí/ Santo Ângelo",
            atendidos: [
            ["São Miguel das Missões", 11, 6, "50 - 200", "51 - 100"],
            ["Vitória das Missões", 5, 2, "< 50 km", "< 50 km"],
            ["Porto Xavier", 16, 9, "50 - 200", "101 - 150"],
            ["Pirapó", 4, 2, "50 - 200", "101 - 150"],
            ["Roque Gonzales", 10, 6, "50 - 200", "101 - 150"],
            ["Santo Ângelo", 106, 0, "< 50 km", null],
            ],
        },
        {
            macro: "MISSIONEIRA", municipio: "Alegria", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Santa Rosa", refHd: "Santa Rosa",
            atendidos: [
            ["Alegria", 6, 3, "50 - 200", "51 - 100"],
            ["Independência", 10, 6, "301 - 400", "> 151"],
            ["Horizontina", 23, 11, "< 50 km", "< 50 km"],
            ["Doutor Maurício Cardoso", 7, 3, "50 - 200", "51 - 100"],
            ["Porto Lucena", 7, 3, "50 - 200", "51 - 100"],
            ["Porto Vera Cruz", 3, 1, "50 - 200", "51 - 100"],
            ["São Paulo das Missões", 10, 6, "50 - 200", "51 - 100"],
            ["Cândido Godói", 10, 6, "< 50 km", "< 50 km"],
            ["Campina das Missões", 10, 6, "< 50 km", "< 50 km"],
            ["Boa Vista do Buricá", 11, 6, "50 - 200", "51 - 100"],
            ["Nova Candelária", 5, 2, "50 - 200", "51 - 100"],
            ["São José do Inhacorá", 4, 2, "< 50 km", "< 50 km"],
            ["Santa Rosa", 106, 56, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "NORTE", municipio: "Iraí", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Erechim", refHd: "Erechim",
            atendidos: [
            ["Iraí", 12, 7, "50 - 200", "> 151"],
            ["Ametista do Sul", 13, 7, "50 - 200", "101 - 150"],
            ["Vicente Dutra", 8, 4, "50 - 200", "> 151"],
            ["Caiçara", 8, 4, "50 - 200", "> 151"],
            ],
        },
        {
            macro: "NORTE", municipio: "Carlos Gomes", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Erechim", refHd: "Erechim",
            atendidos: [
            ["Carlos Gomes", 3, 1, "50 - 200", "51 - 100"],
            ["Centenário", 5, 2, "< 50 km", "< 50 km"],
            ["Cruzaltense", 3, 1, "< 50 km", "< 50 km"],
            ["Campinas do Sul", 8, 4, "< 50 km", "< 50 km"],
            ["Erval Grande", 8, 4, "50 - 200", "51 - 100"],
            ["São Valentim", 4, 2, "< 50 km", "< 50 km"],
            ["Barão de Cotegipe", 11, 6, "< 50 km", "< 50 km"],
            ["Ipiranga do Sul", 3, 1, "50 - 200", "51 - 100"],
            ["Estação", 8, 4, "< 50 km", "< 50 km"],
            ["Getúlio Vargas", 23, 12, "< 50 km", "< 50 km"],
            ["Itatiba do Sul", 6, 3, "< 50 km", "< 50 km"],
            ["Barra do Rio Azul", 3, 1, "< 50 km", "< 50 km"],
            ["Marcelino Ramos", 7, 3, "50 - 200", "51 - 100"],
            ["Viadutos", 8, 4, "< 50 km", "< 50 km"],
            ["Gaurama", 8, 4, "< 50 km", "< 50 km"],
            ["Nonoai", 22, 12, "50 - 200", "51 - 100"],
            ["Rio dos Índios", 5, 2, "50 - 200", "51 - 100"],
            ["Faxinalzinho", 4, 2, "50 - 200", "51 - 100"],
            ["Ponte Preta", 3, 1, "< 50 km", "< 50 km"],
            ["Jacutinga", 5, 2, "< 50 km", "< 50 km"],
            ["Quatro Irmãos", 3, 1, "< 50 km", "< 50 km"],
            ["Paulo Bento", 4, 2, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "VALES", municipio: "Cachoeira do Sul", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Santa Cruz do Sul", refHd: "Santa Cruz do Sul e Cachoeira do Sul",
            atendidos: [
            ["Cachoeira do Sul", 122, 0, "50 - 200", null],
            ["Arroio do Tigre", 19, 10, "50 - 200", "51 - 100"],
            ["Encruzilhada do Sul", 38, 20, "50 - 200", "101 - 150"],
            ["Caçapava do Sul", 47, 0, "50 - 200", null],
            ],
        },
        {
            macro: "NORTE", municipio: "Lagoa dos Três Cantos", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Passo Fundo", refHd: "Passo Fundo",
            atendidos: [
            ["Lagoa dos Três Cantos", 3, 4, "50 - 200", "> 151"],
            ["Não-Me-Toque", 24, 3, "50 - 200", "101 - 150"],
            ["Victor Graeff", 5, 3, "50 - 200", "101 - 150"],
            ],
        },
        {
            macro: "NORTE", municipio: "Machadinho", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Passo Fundo", refHd: "Passo Fundo e Passo Fundo/ Soledade",
            atendidos: [
            ["Machadinho", 10, 3, "50 - 200", "101 - 150"],
            ["Severiano de Almeida", 6, 4, "50 - 200", "> 151"],
            ["Paim Filho", 6, 1, "50 - 200", "101 - 150"],
            ["São João da Urtiga", 8, 2, "50 - 200", "51 - 100"],
            ["Barracão", 8, 6, "50 - 200", "51 - 100"],
            ["Capão Bonito do Sul", 3, 8, "< 50 km", "< 50 km"],
            ["Caseiros", 5, 8, "< 50 km", "< 50 km"],
            ["Ibiraiaras", 11, 2, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "NORTE", municipio: "Fontoura Xavier", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Soledade", refHd: "Passo Fundo/ Soledade",
            atendidos: [
            ["Fontoura Xavier", 15, 2, "< 50 km", "< 50 km"],
            ["Arvorezinha", 16, 8, "50 - 200", "51 - 100"],
            ["Itapuca", 4, 11, "< 50 km", "< 50 km"],
            ["Tio Hugo", 5, 1, "50 - 200", "51 - 100"],
            ["Tapera", 16, 0, "< 50 km", null],
            ["Espumoso", 20, 0, "50 - 200", null],
            ["Alto Alegre", 3, 0, "50 - 200", null],
            ["Soledade", 46, 0, "50 - 200", null],
            ],
        },
        {
            macro: "NORTE", municipio: "Cerro Grande", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Ijuí", refHd: "Passo Fundo Palmeira das Missões, Pelotas e Pelotas/ Bagé",
            atendidos: [
            ["Cerro Grande", 4, 9, "50 - 200", "51 - 100"],
            ["Lajeado do Bugre", 5, 4, "50 - 200", "51 - 100"],
            ["Boa Vista das Missões", 4, 1, "50 - 200", "51 - 100"],
            ["Ronda Alta", 16, 4, "50 - 200", "51 - 100"],
            ["Rondinha", 8, 7, "201 - 300", "101 - 150"],
            ["Engenho Velho", 3, 22, "50 - 200", "101 - 150"],
            ["Três Palmeiras", 8, 15, "50 - 200", "51 - 100"],
            ["Trindade do Sul", 13, 9, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "SUL", municipio: "Jaguarão", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Pelotas", refHd: "Pelotas/ Bagé, Porto Alegre/ Camaquã e Bagé",
            atendidos: [
            ["Jaguarão", 43, 2, "50 - 200", "101 - 150"],
            ["Arroio Grande", 28, 0, "50 - 200", null],
            ["Pinheiro Machado", 17, 2, "< 50 km", "< 50 km"],
            ["Pedras Altas", 4, 0, "< 50 km", null],
            ["Amaral Ferrador", 9, 8, "50 - 200", "51 - 100"],
            ["Turuçu", 6, 31, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "NORTE", municipio: "Cristal", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Camaquã", refHd: "Caxias do Sul/ Vacaria",
            atendidos: [
            ["Cristal", 5, 9, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "SUL", municipio: "Candiota", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Bagé", refHd: "Caxias do Sul/ Vacaria",
            atendidos: [
            ["Candiota", 15, 2, "< 50 km", "< 50 km"],
            ["Dom Pedrito", 58, 3, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "SERRA", municipio: "Bom Jesus", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Vacaria", refHd: "Caxias do Sul/ Vacaria e Bento Gonçalves/ Nova Prata",
            atendidos: [
            ["Bom Jesus", 17, 3, "< 50 km", "< 50 km"],
            ["Campestre da Serra", 5, 48, "< 50 km", "< 50 km"],
            ["Jaquirana", 6, 2, "50 - 200", "51 - 100"],
            ["Monte Alegre dos Campos", 6, 2, "< 50 km", "< 50 km"],
            ["Vacaria", 91, 2, "50 - 200", "51 - 100"],
            ["Esmeralda", 5, 3, "50 - 200", "101 - 150"],
            ["Muitos Capões", 5, 2, "50 - 200", "< 50 km"],
            ["Pinhal da Serra", 4, 2, "< 50 km", "< 50 km"],
            ["São José dos Ausentes", 7, 2, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "SERRA", municipio: "Nova Bassano", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Bento Gonçalves e Nova Prata", refHd: "Nova Prata / Bento Gonçalves e Caxias do Sul",
            atendidos: [
            ["Cotiporã", 5, 1, "50 - 200", "51 - 100"],
            ["Fagundes Varela", 4, 14, "< 50 km", "< 50 km"],
            ["São Jorge", 5, 1, "< 50 km", "< 50 km"],
            ["União da Serra", 2, 9, "50 - 200", "< 50 km"],
            ["Guaporé", 27, 2, "< 50 km", "< 50 km"],
            ["Vista Alegre do Prata", 3, 10, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "SERRA", municipio: "Feliz", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Caxias do Sul", refHd: "Caxias do Sul e Santa Cruz do Sul",
            atendidos: [
            ["Feliz", 17, 35, "< 50 km", "< 50 km"],
            ["Alto Feliz", 4, 1, "< 50 km", "< 50 km"],
            ["Bom Princípio", 18, 3, "< 50 km", "< 50 km"],
            ["Farroupilha", 66, 9, "50 - 200", "51 - 100"],
            ["São Vendelino", 4, 2, "50 - 200", "51 - 100"],
            ["Vale Real", 7, 2, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "VALES", municipio: "Pantano Grande", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Santa Cruz do Sul", refHd: "Porto Alegre/ Camaquã",
            atendidos: [
            ["Pantano Grande", 16, 12, "50 - 200", "51 - 100"],
            ["Gramado Xavier", 5, 6, "50 - 200", "51 - 100"],
            ["Herveiras", 4, 6, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "METROPOLITANA", municipio: "Tapes", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Camaquã e Porto Alegre", refHd: "Passo Fundo e Carazinho",
            atendidos: [
            ["Tapes", 23, 0, "50 - 200", null],
            ["Minas do Leão", 11, 0, "50 - 200", null],
            ["Sertão Santana", 10, 47, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "NORTE", municipio: "Seberi", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Ijuí", refHd: "Passo Fundo e Carazinho",
            atendidos: [
            ["Seberi", 19, 2, "< 50 km", "< 50 km"],
            ["Erval Seco", 11, 2, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "NORTE", municipio: "Carazinho", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Carazinho", refHd: "Passo Fundo e Carazinho",
            atendidos: [
            ["Carazinho", 89, 12, "50 - 200", "< 50 km"],
            ["Almirante Tamandaré do Sul", 4, 2, "< 50 km", "< 50 km"],
            ["Coqueiros do Sul", 4, 2, "50 - 200", "< 50 km"],
            ["Santo Antônio do Planalto", 4, 4, "50 - 200", "101 - 150"],
            ],
        },
        {
            macro: "NORTE", municipio: "Cacique Doble", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Passo Fundo", refHd: "Passo Fundo e Pelotas",
            atendidos: [
            ["Cacique Doble", 8, 22, "50 - 200", "51 - 100"],
            ["Lagoa Vermelha", 41, 6, "50 - 200", "101 - 150"],
            ["São José do Ouro", 11, 3, "50 - 200", "51 - 100"],
            ["Ibiaçá", 8, 13, "50 - 200", "51 - 100"],
            ["Sananduva", 25, 20, "50 - 200", "51 - 100"],
            ["Tapejara", 37, 43, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "SUL", municipio: "Canguçu", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Pelotas", refHd: "Pelotas e Nova Prata / Bento Gonçalves",
            atendidos: [
            ["Canguçu", 81, 6, "< 50 km", "< 50 km"],
            ["Morro Redondo", 10, 7, "50 - 200", "101 - 150"],
            ["Santana da Boa Vista", 12, 15, "50 - 200", "101 - 150"],
            ["Piratini", 28, 6, "50 - 200", "51 - 100"],
            ["Cerrito", 10, 7, "50 - 200", "51 - 100"],
            ["Pedro Osório", 12, 6, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "SERRA", municipio: "Paraí", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Nova Prata", refHd: "Nova Prata / Bento Gonçalves e Caxias do Sul",
            atendidos: [
            ["Paraí", 10, 1, "< 50 km", "< 50 km"],
            ["Guabijú", 2, 3, "< 50 km", "< 50 km"],
            ["Nova Araçá", 7, 7, "< 50 km", "< 50 km"],
            ["Nova Bassano", 13, 15, "< 50 km", "< 50 km"],
            ["Nova Prata", 30, 12, "< 50 km", "< 50 km"],
            ["Veranópolis", 24, 2, "< 50 km", "< 50 km"],
            ["Vila Flores", 4, 6, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "SERRA", municipio: "Antônio Prado", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Caxias do Sul", refHd: "Caxias do Sul, Santa Cruz do Sul e Cachoeira do Sul",
            atendidos: [
            ["Antônio Prado", 12, 2, "< 50 km", "51 - 100"],
            ["Nova Roma do Sul", 4, 1, "< 50 km", "< 50 km"],
            ["Nova Pádua", 2, 11, "< 50 km", "< 50 km"],
            ["Flores da Cunha", 23, 12, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "VALES", municipio: "Sobradinho", gestorHd: null,
            tipo: null, tipoHd: null, nVeiculos: null,
            refRt: "Santa Cruz do Sul", refHd: "Santa Cruz do Sul e Cachoeira do Sul",
            atendidos: [
            ["Sobradinho", 22, 25, "50 - 200", "101 - 150"],
            ],
        },
    ],
    PB: [
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Bayeux", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "João Pessoa", refHd: "João Pessoa",
            atendidos: [
            ["Bayeux", 111.5, 68, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Solânea", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Guarabira",
            atendidos: [
            ["Solânea", 38.5, 24, "50 - 200", "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Esperança", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Campina Grande",
            atendidos: [
            ["Esperança", 45, 27, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Cuité", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Campina Grande",
            atendidos: [
            ["Cuité", 28.5, 18, "50 - 200", "101 - 150"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Sumé", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Campina Grande",
            atendidos: [
            ["Sumé", 25, 15, "50 - 200", "101 - 150"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Santa Luzia", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Patos",
            atendidos: [
            ["Santa Luzia", 21.5, 13, "50 - 200", "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Itaporanga", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Patos",
            atendidos: [
            ["Itaporanga", 34.5, 21, "201 - 300", "101 - 150"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "São Bento", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Patos",
            atendidos: [
            ["São Bento", 47.5, 29, "201 - 300", "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "São José de Piranhas", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Cajazeiras",
            atendidos: [
            ["São José de Piranhas", 27.5, 17, "301 - 400", "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Aparecida", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Sousa",
            atendidos: [
            ["Aparecida", 11.5, 7, "201 - 300", "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Princesa Isabel", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Patos",
            atendidos: [
            ["Princesa Isabel", 30.5, 19, "301 - 400", "101 - 150"],
            ],
        },
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Pedras de Fogo", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "João Pessoa", refHd: "João Pessoa",
            atendidos: [
            ["Pedras de Fogo", 43, 26, "> 401", "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Paulista", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Patos",
            atendidos: [
            ["Paulista", 13.5, 9, "201 - 300", "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Rio Tinto", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "João Pessoa", refHd: "João Pessoa",
            atendidos: [
            ["Rio Tinto", 35.5, 22, "50 - 200", "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Queimadas", gestorHd: null,
            tipo: "Van + Micro-ônibus", tipoHd: null, nVeiculos: null,
            refRt: "Campina Grande", refHd: "Campina Grande",
            atendidos: [
            ["Queimadas", 68, 40, "< 50 km", "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Pocinhos", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Pocinhos", 0, 15, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Cabedelo", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "João Pessoa",
            atendidos: [
            ["Cabedelo", 0, 46, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Bananeiras", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guarabira",
            atendidos: [
            ["Bananeiras", 0, 20, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Lagoa Seca", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Lagoa Seca", 0, 24, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Barra de Santa Rosa", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Barra de Santa Rosa", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Serra Branca", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Serra Branca", 0, 12, null, "101 - 150"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Teixeira", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Patos",
            atendidos: [
            ["Teixeira", 0, 13, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Conceição", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Patos",
            atendidos: [
            ["Conceição", 0, 17, null, "> 151"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Brejo do Cruz", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Patos",
            atendidos: [
            ["Brejo do Cruz", 0, 12, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "São João do Rio do Peixe", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Cajazeiras",
            atendidos: [
            ["São João do Rio do Peixe", 0, 16, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Nazarezinho", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Sousa",
            atendidos: [
            ["Nazarezinho", 0, 7, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Tavares", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Patos",
            atendidos: [
            ["Tavares", 0, 13, null, "101 - 150"],
            ],
        },
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Itabaiana", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "João Pessoa",
            atendidos: [
            ["Itabaiana", 0, 20, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Lagoa", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Sousa",
            atendidos: [
            ["Lagoa", 0, 4, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO I - JOAO PESSOA", municipio: "Itapororoca", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Guarabira",
            atendidos: [
            ["Itapororoca", 0, 17, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Aroeiras", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Aroeiras", 0, 17, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Juazeirinho", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Juazeirinho", 0, 15, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "São Vicente do Seridó", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["São Vicente do Seridó", 0, 10, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Camalaú", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Camalaú", 0, 6, null, "> 151"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Desterro", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Patos",
            atendidos: [
            ["Desterro", 0, 8, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Coremas", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Patos",
            atendidos: [
            ["Coremas", 0, 13, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Riacho dos Cavalos", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Sousa",
            atendidos: [
            ["Riacho dos Cavalos", 0, 8, null, "51 - 100"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Uiraúna", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Sousa",
            atendidos: [
            ["Uiraúna", 0, 13, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO III - SERTAO ALTO SERTAO", municipio: "Manaíra", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Patos",
            atendidos: [
            ["Manaíra", 0, 10, null, "> 151"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Boqueirão", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Boqueirão", 0, 16, null, "< 50 km"],
            ],
        },
        {
            macro: "MACRORREGIAO II - CAMPINA GRANDE", municipio: "Puxinanã", gestorHd: null,
            tipo: "Van", tipoHd: null, nVeiculos: null,
            refRt: null, refHd: "Campina Grande",
            atendidos: [
            ["Puxinanã", 0, 13, null, "< 50 km"],
            ],
        },
    ],
};

export class SeedCusteioNovos1700000064000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        for (const [uf, responsaveis] of Object.entries(SEEDS)) {
            const existing = await queryRunner.query(
                `SELECT COUNT(*)::int AS count FROM "custeio_responsavel" WHERE "uf" = $1`,
                [uf],
            );
            if (existing[0]?.count !== 0) continue;

            for (let i = 0; i < responsaveis.length; i++) {
                const r = responsaveis[i];
                const inserted = await queryRunner.query(
                    `INSERT INTO "custeio_responsavel"
                        ("uf", "ordem", "macrorregiao", "municipio", "gestor_hd", "tipo_veiculo", "tipo_veiculo_hd",
                         "n_veiculos", "ref_rt", "ref_hd")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING "id"`,
                    [uf, i, r.macro, r.municipio, r.gestorHd, r.tipo, r.tipoHd, r.nVeiculos, r.refRt, r.refHd],
                );
                const responsavelId: number = inserted[0].id;
                for (let j = 0; j < r.atendidos.length; j++) {
                    const [nome, rt, hd, faixaRt, faixaHd] = r.atendidos[j];
                    await queryRunner.query(
                        `INSERT INTO "custeio_atendido"
                            ("responsavel_id", "ordem", "nome", "rt", "hd", "dist_rt", "dist_hd", "faixa_rt", "faixa_hd")
                         VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7)`,
                        [responsavelId, j, nome, rt, hd, faixaRt, faixaHd],
                    );
                }
            }
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "custeio_responsavel" WHERE "uf" IN ('AM', 'BA', 'PR', 'RS', 'PB')`);
    }
}
