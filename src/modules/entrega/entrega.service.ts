import { Injectable, NotFoundException } from "@nestjs/common";
import { TransportRtxRepository } from "../transport-rtx/transport-rtx.repository";
import { TransportTrsRepository } from "../transport-trs/transport-trs.repository";
import { GeneralQuotaRepository } from "../general-quota/general-quota.repository";
import { DeliveredRtxTrsRepository } from "../delivered-rtx-trs/delivered-rtx-trs.repository";
import { DeliveredGeneralQuotaRepository } from "../delivered-general-quota/delivered-general-quota.repository";
import { UfRepository } from "../uf/uf.repository";
import { UpdateEntregaDto } from "./dto/entrega.dto";

@Injectable()
export class EntregaService {
    constructor(
        private readonly transportRtxRepo: TransportRtxRepository,
        private readonly transportTrsRepo: TransportTrsRepository,
        private readonly generalQuotaRepo: GeneralQuotaRepository,
        private readonly deliveredRtxTrsRepo: DeliveredRtxTrsRepository,
        private readonly deliveredGeneralQuotaRepo: DeliveredGeneralQuotaRepository,
        private readonly ufRepo: UfRepository,
    ) {}

    async findAll() {
        const ufs = await this.ufRepo.findAll();
        const [tRtx, tTrs, gq, dRtxTrs, dGq] = await Promise.all([
            this.transportRtxRepo.findAll(),
            this.transportTrsRepo.findAll(),
            this.generalQuotaRepo.findAll(),
            this.deliveredRtxTrsRepo.findAll(),
            this.deliveredGeneralQuotaRepo.findAll(),
        ]);

        return ufs.map((uf) => ({
            uf,
            transport: {
                rtx: tRtx.find((r) => r.ufId === uf.id) ?? null,
                trs: tTrs.find((t) => t.ufId === uf.id) ?? null,
                generalQuota: gq.find((g) => g.ufId === uf.id) ?? null,
            },
            delivered: {
                rtxTrs: dRtxTrs.find((r) => r.ufId === uf.id) ?? null,
                generalQuota: dGq.find((g) => g.ufId === uf.id) ?? null,
            },
        }));
    }

    async findByUfId(ufId: number) {
        const uf = await this.ufRepo.findById(ufId);
        if (!uf) throw new NotFoundException(`UF ${ufId} nao encontrada`);

        const [tRtx, tTrs, gq, dRtxTrs, dGq] = await Promise.all([
            this.transportRtxRepo.findByUfId(ufId),
            this.transportTrsRepo.findByUfId(ufId),
            this.generalQuotaRepo.findByUfId(ufId),
            this.deliveredRtxTrsRepo.findByUfId(ufId),
            this.deliveredGeneralQuotaRepo.findByUfId(ufId),
        ]);

        return {
            uf,
            transport: { rtx: tRtx, trs: tTrs, generalQuota: gq },
            delivered: { rtxTrs: dRtxTrs, generalQuota: dGq },
        };
    }

    async updateByUfId(ufId: number, data: UpdateEntregaDto) {
        const uf = await this.ufRepo.findById(ufId);
        if (!uf) throw new NotFoundException(`UF ${ufId} nao encontrada`);

        if (data.rtxTrs) await this.deliveredRtxTrsRepo.updateByUfId(ufId, data.rtxTrs);
        if (data.generalQuota) await this.deliveredGeneralQuotaRepo.updateByUfId(ufId, data.generalQuota);
        if (data.rtxObservation !== undefined) await this.transportRtxRepo.updateByUfId(ufId, { observation: data.rtxObservation });
        if (data.trsObservation !== undefined) await this.transportTrsRepo.updateByUfId(ufId, { observation: data.trsObservation });
        if (data.cib !== undefined || data.agreement !== undefined) {
            await this.ufRepo.update(uf.id, {
                ...(data.cib !== undefined && { cib: data.cib }),
                ...(data.agreement !== undefined && { agreement: data.agreement }),
            });
        }
    }
}
