import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DeliveredGeneralQuotaRepository } from "../delivered-general-quota/delivered-general-quota.repository";
import { UfRepository } from "../uf/uf.repository";
import { UpdateCotaGeralDto } from "./dto/cota-geral.dto";

type MuniSum = { uf: string; ambulance: number; van: number; microbus: number };

@Injectable()
export class CotaGeralService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly deliveredGeneralQuotaRepo: DeliveredGeneralQuotaRepository,
        private readonly ufRepo: UfRepository,
    ) {}

    private async getMuniTotals(): Promise<Map<string, MuniSum>> {
        const rows = await this.dataSource.query<MuniSum[]>(
            `SELECT uf,
                    COALESCE(SUM(ambulancia), 0)::int AS ambulance,
                    COALESCE(SUM(van), 0)::int        AS van,
                    COALESCE(SUM(microonibus), 0)::int AS microbus
             FROM cota_geral_municipio
             GROUP BY uf`,
        );
        return new Map(rows.map((r) => [r.uf, r]));
    }

    async findAll() {
        const ufs = await this.ufRepo.findAll();
        const [muniByUf, dgqList] = await Promise.all([
            this.getMuniTotals(),
            this.deliveredGeneralQuotaRepo.findAll(),
        ]);

        return ufs.map((uf) => {
            const m = muniByUf.get(uf.uf) ?? { ambulance: 0, van: 0, microbus: 0 };
            return {
                uf,
                generalQuota: { van: m.van, ambulance: m.ambulance, microbus: m.microbus },
                deliveredGeneralQuota: dgqList.find((d) => d.ufId === uf.id) ?? null,
            };
        });
    }

    async findByUfId(ufId: number) {
        const uf = await this.ufRepo.findById(ufId);
        if (!uf) throw new NotFoundException(`UF ${ufId} não encontrada`);

        const [rows, deliveredGeneralQuota] = await Promise.all([
            this.dataSource.query<MuniSum[]>(
                `SELECT COALESCE(SUM(ambulancia), 0)::int AS ambulance,
                        COALESCE(SUM(van), 0)::int        AS van,
                        COALESCE(SUM(microonibus), 0)::int AS microbus
                 FROM cota_geral_municipio
                 WHERE uf = $1`,
                [uf.uf],
            ),
            this.deliveredGeneralQuotaRepo.findByUfId(ufId),
        ]);

        const m = rows[0] ?? { ambulance: 0, van: 0, microbus: 0 };
        return {
            uf,
            generalQuota: { van: m.van, ambulance: m.ambulance, microbus: m.microbus },
            deliveredGeneralQuota,
        };
    }

    async findByUfCode(ufCode: string) {
        const uf = await this.ufRepo.findByUf(ufCode);
        if (!uf) throw new NotFoundException(`UF ${ufCode} não encontrada`);

        type MuniRow = {
            id: number; ibge: string; uf: string; nomeMunicipio: string;
            enteBeneficiario: string; finalidade: string;
            ambulancia: number; microonibus: number; van: number;
        };

        const [totals, deliveredGeneralQuota, municipios] = await Promise.all([
            this.dataSource.query<MuniSum[]>(
                `SELECT COALESCE(SUM(ambulancia), 0)::int AS ambulance,
                        COALESCE(SUM(van), 0)::int        AS van,
                        COALESCE(SUM(microonibus), 0)::int AS microbus
                 FROM cota_geral_municipio WHERE uf = $1`,
                [uf.uf],
            ),
            this.deliveredGeneralQuotaRepo.findByUfId(uf.id),
            this.dataSource.query<MuniRow[]>(
                `SELECT id, ibge, uf,
                        nome_municipio    AS "nomeMunicipio",
                        ente_beneficiario AS "enteBeneficiario",
                        finalidade, ambulancia, microonibus, van
                 FROM cota_geral_municipio
                 WHERE uf = $1
                 ORDER BY nome_municipio ASC`,
                [uf.uf],
            ),
        ]);

        const m = totals[0] ?? { ambulance: 0, van: 0, microbus: 0 };
        return {
            uf,
            generalQuota: { van: m.van, ambulance: m.ambulance, microbus: m.microbus },
            deliveredGeneralQuota,
            municipios,
        };
    }

    async updateByUfId(ufId: number, data: UpdateCotaGeralDto) {
        const uf = await this.ufRepo.findById(ufId);
        if (!uf) throw new NotFoundException(`UF ${ufId} não encontrada`);

        if (data.deliveredGeneralQuota) {
            await this.deliveredGeneralQuotaRepo.updateByUfId(ufId, data.deliveredGeneralQuota);
        }

        return this.findByUfId(ufId);
    }
}
