import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DeliveredGeneralQuota } from "./entities/delivered-general-quota.entity";
import { DeliveredGeneralQuotaDto, UpdateDeliveredGeneralQuotaDto } from "./dto/delivered-general-quota.dto";

@Injectable()
export class DeliveredGeneralQuotaRepository {
    constructor(
        @InjectRepository(DeliveredGeneralQuota)
        private readonly repo: Repository<DeliveredGeneralQuota>,
    ) {}

    findAll(): Promise<DeliveredGeneralQuota[]> { return this.repo.find({ relations: { uf: true }, order: { uf: { uf: "ASC" } } }); }
    findById(id: number): Promise<DeliveredGeneralQuota | null> { return this.repo.findOne({ where: { id }, relations: { uf: true } }); }
    findByUfId(ufId: number): Promise<DeliveredGeneralQuota | null> { return this.repo.findOne({ where: { ufId } }); }

    create(data: DeliveredGeneralQuotaDto): Promise<DeliveredGeneralQuota> { return this.repo.save(this.repo.create(data)); }

    async update(id: number, data: UpdateDeliveredGeneralQuotaDto): Promise<DeliveredGeneralQuota> {
        const entity = await this.repo.findOneOrFail({ where: { id } });
        Object.assign(entity, data);
        return this.repo.save(entity);
    }

    async updateByUfId(ufId: number, data: UpdateDeliveredGeneralQuotaDto): Promise<DeliveredGeneralQuota> {
        let entity = await this.repo.findOne({ where: { ufId } });
        if (!entity) {
            entity = this.repo.create({ ufId, van: 0, ambulance: 0, microbus: 0 });
        }
        Object.assign(entity, data);
        return this.repo.save(entity);
    }

    async softDelete(id: number): Promise<void> { await this.repo.softDelete(id); }
}
