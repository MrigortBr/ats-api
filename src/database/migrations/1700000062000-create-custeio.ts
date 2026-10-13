import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Custeio do Transporte Sanitário: um responsável por linha e um município atendido por linha.
 * Seed inicial: RO (extraído de ro.json). Seed só roda com a tabela vazia.
 */
interface SeedAtendido { nome: string; tag?: string; rt: number; hd: number; distRt: number; distHd: number }
interface SeedResponsavel {
    macrorregiao: string; municipio: string; tipoVeiculo: string; nVeiculos: number;
    refRt: string; refHd: string; atendidos: SeedAtendido[]; divisao?: { n: number; indice: number } | null;
}

const RO: SeedResponsavel[] = [
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Urupá",
        "tipoVeiculo": "Van",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Ji-Paraná",
        "atendidos": [
            {
                "nome": "Urupá",
                "rt": 10,
                "hd": 10,
                "distRt": 138.8,
                "distHd": 83.9
            },
            {
                "nome": "Teixeirópolis",
                "rt": 4,
                "hd": 5,
                "distRt": 161,
                "distHd": 52.8
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Ouro Preto do Oeste",
        "tipoVeiculo": "Van",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Ji-Paraná",
        "atendidos": [
            {
                "nome": "Ouro Preto do Oeste",
                "rt": 31,
                "hd": 30,
                "distRt": 148.2,
                "distHd": 40
            },
            {
                "nome": "Vale do Paraíso",
                "rt": 6,
                "hd": 7,
                "distRt": 183.8,
                "distHd": 75.6
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Vale do Anari",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Ji-Paraná",
        "atendidos": [
            {
                "nome": "Vale do Anari",
                "rt": 8,
                "hd": 8,
                "distRt": 333.1,
                "distHd": 167.6
            },
            {
                "nome": "Theobroma",
                "rt": 8,
                "hd": 8,
                "distRt": 312.5,
                "distHd": 112.6
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Jaru",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Ji-Paraná",
        "atendidos": [
            {
                "nome": "Jaru",
                "rt": 46,
                "hd": 43,
                "distRt": 292,
                "distHd": 81.5
            },
            {
                "nome": "Governador Jorge Teixeira",
                "rt": 8,
                "hd": 8,
                "distRt": 322,
                "distHd": 122
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Mirante da Serra",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Ji-Paraná",
        "atendidos": [
            {
                "nome": "Mirante da Serra",
                "rt": 9,
                "hd": 9,
                "distRt": 211.5,
                "distHd": 103.3
            },
            {
                "nome": "Nova União",
                "rt": 6,
                "hd": 6,
                "distRt": 192.9,
                "distHd": 84.6
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "São Miguel do Guaporé",
        "tipoVeiculo": "Van",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Vilhena",
        "atendidos": [
            {
                "nome": "São Miguel do Guaporé",
                "rt": 19,
                "hd": 19,
                "distRt": 187.2,
                "distHd": 363.1
            },
            {
                "nome": "Alvorada d'Oeste",
                "rt": 12,
                "hd": 13,
                "distRt": 118.7,
                "distHd": 345.2
            },
            {
                "nome": "Presidente Médici",
                "rt": 17,
                "hd": 17,
                "distRt": 70.9,
                "distHd": 297.5
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Pimenteiras do Oeste",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Vilhena",
        "atendidos": [
            {
                "nome": "Pimenteiras do Oeste",
                "rt": 2,
                "hd": 3,
                "distRt": 373.1,
                "distHd": 177.3
            },
            {
                "nome": "Cerejeiras",
                "rt": 14,
                "hd": 15,
                "distRt": 320.7,
                "distHd": 124.9
            },
            {
                "nome": "Corumbiara",
                "rt": 7,
                "hd": 7,
                "distRt": 251.7,
                "distHd": 162.2
            },
            {
                "nome": "Vilhena",
                "rt": 82,
                "hd": 75,
                "distRt": 227.7,
                "distHd": 0
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Colorado do Oeste",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Vilhena",
        "atendidos": [
            {
                "nome": "Colorado do Oeste",
                "rt": 14,
                "hd": 14,
                "distRt": 281.9,
                "distHd": 86
            },
            {
                "nome": "Cabixi",
                "rt": 5,
                "hd": 6,
                "distRt": 327.4,
                "distHd": 131.6
            },
            {
                "nome": "Chupinguaia",
                "rt": 9,
                "hd": 9,
                "distRt": 180.8,
                "distHd": 144.9
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Ariquemes",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Ariquemes",
        "atendidos": [
            {
                "nome": "Ariquemes",
                "rt": 87,
                "hd": 81,
                "distRt": 202.2,
                "distHd": 0
            },
            {
                "nome": "Alto Paraíso",
                "rt": 15,
                "hd": 15,
                "distRt": 206.8,
                "distHd": 57.7
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Buritis",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Ariquemes",
        "atendidos": [
            {
                "nome": "Buritis",
                "rt": 26,
                "hd": 26,
                "distRt": 327.5,
                "distHd": 130.2,
                "tag": "entorno"
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Monte Negro",
        "tipoVeiculo": "Van",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Ariquemes",
        "atendidos": [
            {
                "nome": "Monte Negro",
                "rt": 11,
                "hd": 11,
                "distRt": 251.4,
                "distHd": 54.1,
                "tag": "entorno"
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Campo Novo de Rondônia",
        "tipoVeiculo": "Van",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Ariquemes",
        "atendidos": [
            {
                "nome": "Campo Novo de Rondônia",
                "rt": 8,
                "hd": 9,
                "distRt": 307.1,
                "distHd": 109.8,
                "tag": "entorno"
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Porto Velho",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Porto Velho",
        "atendidos": [
            {
                "nome": "Porto Velho",
                "rt": 369,
                "hd": 337,
                "distRt": 0,
                "distHd": 0,
                "tag": "distritos"
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIAO I - PORTO VELHO",
        "municipio": "Candeias do Jamari",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Porto Velho",
        "refHd": "Porto Velho",
        "atendidos": [
            {
                "nome": "Candeias do Jamari",
                "rt": 21,
                "hd": 20,
                "distRt": 24.4,
                "distHd": 24.4,
                "tag": "distritos"
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Pimenta Bueno",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Cacoal",
        "atendidos": [
            {
                "nome": "Pimenta Bueno",
                "rt": 31,
                "hd": 29,
                "distRt": 43.1,
                "distHd": 43.1,
                "tag": "entorno"
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Espigão d'Oeste",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Cacoal",
        "atendidos": [
            {
                "nome": "Espigão d'Oeste",
                "rt": 27,
                "hd": 26,
                "distRt": 62.5,
                "distHd": 62.5,
                "tag": "entorno"
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Rolim de Moura",
        "tipoVeiculo": "Van",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Cacoal",
        "atendidos": [
            {
                "nome": "Rolim de Moura",
                "rt": 51,
                "hd": 48,
                "distRt": 63.8,
                "distHd": 63.8
            },
            {
                "nome": "Nova Brasilândia d'Oeste",
                "rt": 14,
                "hd": 15,
                "distRt": 124,
                "distHd": 124
            },
            {
                "nome": "Novo Horizonte do Oeste",
                "rt": 7,
                "hd": 8,
                "distRt": 89.8,
                "distHd": 89.8
            },
            {
                "nome": "Castanheiras",
                "rt": 3,
                "hd": 4,
                "distRt": 77.6,
                "distHd": 77.6
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Alta Floresta d'Oeste",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Cacoal",
        "atendidos": [
            {
                "nome": "Alta Floresta d'Oeste",
                "rt": 19,
                "hd": 19,
                "distRt": 109.5,
                "distHd": 109.5
            },
            {
                "nome": "Alto Alegre dos Parecis",
                "rt": 11,
                "hd": 11,
                "distRt": 117.6,
                "distHd": 117.6
            },
            {
                "nome": "Santa Luzia d'Oeste",
                "rt": 7,
                "hd": 7,
                "distRt": 84,
                "distHd": 84
            }
        ],
        "divisao": null
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Costa Marques",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Ji-Paraná",
        "atendidos": [
            {
                "nome": "Costa Marques",
                "rt": 12,
                "hd": 11,
                "distRt": 405.7,
                "distHd": 366.7
            },
            {
                "nome": "Seringueiras",
                "rt": 11,
                "hd": 11,
                "distRt": 223.9,
                "distHd": 184.9
            },
            {
                "nome": "São Francisco do Guaporé",
                "rt": 15,
                "hd": 15,
                "distRt": 295.5,
                "distHd": 256.4
            }
        ],
        "divisao": {
            "n": 2,
            "indice": 0
        }
    },
    {
        "macrorregiao": "MACRORREGIONAL II (CACOAL)",
        "municipio": "Seringueiras",
        "tipoVeiculo": "Micro-ônibus",
        "nVeiculos": 1,
        "refRt": "Cacoal",
        "refHd": "Ji-Paraná",
        "atendidos": [
            {
                "nome": "Costa Marques",
                "rt": 12,
                "hd": 11,
                "distRt": 405.7,
                "distHd": 366.7
            },
            {
                "nome": "Seringueiras",
                "rt": 11,
                "hd": 11,
                "distRt": 223.9,
                "distHd": 184.9
            },
            {
                "nome": "São Francisco do Guaporé",
                "rt": 15,
                "hd": 15,
                "distRt": 295.5,
                "distHd": 256.4
            }
        ],
        "divisao": {
            "n": 2,
            "indice": 1
        }
    }
];

export class CreateCusteio1700000062000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "custeio_responsavel" (
                "id" SERIAL PRIMARY KEY,
                "uf" VARCHAR(2) NOT NULL,
                "ordem" INTEGER NOT NULL DEFAULT 0,
                "macrorregiao" VARCHAR NOT NULL,
                "municipio" VARCHAR NOT NULL,
                "tipo_veiculo" VARCHAR NOT NULL,
                "n_veiculos" INTEGER NOT NULL DEFAULT 0,
                "ref_rt" VARCHAR NOT NULL,
                "ref_hd" VARCHAR NOT NULL,
                "divisao_n" INTEGER,
                "divisao_indice" INTEGER
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_custeio_responsavel_uf" ON "custeio_responsavel" ("uf", "ordem")`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "custeio_atendido" (
                "id" SERIAL PRIMARY KEY,
                "responsavel_id" INTEGER NOT NULL REFERENCES "custeio_responsavel"("id") ON DELETE CASCADE,
                "ordem" INTEGER NOT NULL DEFAULT 0,
                "nome" VARCHAR NOT NULL,
                "tag" VARCHAR,
                "rt" INTEGER NOT NULL DEFAULT 0,
                "hd" INTEGER NOT NULL DEFAULT 0,
                "dist_rt" NUMERIC(9,2) NOT NULL DEFAULT 0,
                "dist_hd" NUMERIC(9,2) NOT NULL DEFAULT 0
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_custeio_atendido_responsavel" ON "custeio_atendido" ("responsavel_id", "ordem")`);

        const existing = await queryRunner.query(`SELECT COUNT(*)::int AS count FROM "custeio_responsavel"`);
        if (existing[0]?.count !== 0) return;

        for (let i = 0; i < RO.length; i++) {
            const r = RO[i];
            const inserted = await queryRunner.query(
                `INSERT INTO "custeio_responsavel"
                    ("uf", "ordem", "macrorregiao", "municipio", "tipo_veiculo", "n_veiculos", "ref_rt", "ref_hd", "divisao_n", "divisao_indice")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING "id"`,
                [
                    "RO", i, r.macrorregiao, r.municipio, r.tipoVeiculo, r.nVeiculos, r.refRt, r.refHd,
                    r.divisao?.n ?? null, r.divisao?.indice ?? null,
                ],
            );
            const responsavelId: number = inserted[0].id;
            for (let j = 0; j < r.atendidos.length; j++) {
                const a = r.atendidos[j];
                await queryRunner.query(
                    `INSERT INTO "custeio_atendido" ("responsavel_id", "ordem", "nome", "tag", "rt", "hd", "dist_rt", "dist_hd")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [responsavelId, j, a.nome, a.tag ?? null, a.rt, a.hd, a.distRt, a.distHd],
                );
            }
        }
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "custeio_atendido"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "custeio_responsavel"`);
    }
}
