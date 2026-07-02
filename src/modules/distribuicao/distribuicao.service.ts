import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { TransportRtxRepository } from "../transport-rtx/transport-rtx.repository";
import { TransportTrsRepository } from "../transport-trs/transport-trs.repository";
import { UfRepository } from "../uf/uf.repository";
import { UpdateDistribuicaoDto } from "./dto/distribuicao.dto";

@Injectable()
export class DistribuicaoService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly transportRtxRepo: TransportRtxRepository,
        private readonly transportTrsRepo: TransportTrsRepository,
        private readonly ufRepo: UfRepository,
    ) {}

    async findAll() {
        const [ufs, rtxList, trsList] = await Promise.all([
            this.ufRepo.findAll(),
            this.transportRtxRepo.findAll(),
            this.transportTrsRepo.findAll(),
        ]);

        return ufs.map((uf) => ({
            uf,
            rtx: rtxList.find((r) => r.ufId === uf.id) ?? null,
            trs: trsList.find((t) => t.ufId === uf.id) ?? null,
        }));
    }

    async findByUfId(ufId: number) {
        const uf = await this.ufRepo.findById(ufId);
        if (!uf) throw new NotFoundException(`UF ${ufId} não encontrada`);

        const rtx = await this.transportRtxRepo.findByUfId(ufId);
        const trs = await this.transportTrsRepo.findByUfId(ufId);

        return { uf, rtx, trs };
    }

    async findByUfCode(ufCode: string) {
        const uf = await this.ufRepo.findByUf(ufCode);
        if (!uf) throw new NotFoundException(`UF ${ufCode} não encontrada`);

        const [rtx, trs] = await Promise.all([
            this.transportRtxRepo.findByUfId(uf.id),
            this.transportTrsRepo.findByUfId(uf.id),
        ]);

        return { uf, rtx, trs };
    }

    async updateByUfId(ufId: number, data: UpdateDistribuicaoDto) {
        const uf = await this.ufRepo.findById(ufId);
        if (!uf) throw new NotFoundException(`UF ${ufId} não encontrada`);

        await this.dataSource.transaction(async () => {
            if (data.rtx) await this.transportRtxRepo.updateByUfId(ufId, data.rtx);
            if (data.trs) await this.transportTrsRepo.updateByUfId(ufId, data.trs);
        });

        return this.findByUfId(ufId);
    }
}
