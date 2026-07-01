import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { CotaGeralMunicipio } from "./entities/cota-geral-municipio.entity";

@Injectable()
export class CotaGeralMunicipioService {
    constructor(
        @InjectRepository(CotaGeralMunicipio)
        private readonly repo: Repository<CotaGeralMunicipio>,
    ) {}

    findByUf(uf: string): Promise<CotaGeralMunicipio[]> {
        return this.repo.find({
            where: { uf: uf.toUpperCase() },
            order: { nomeMunicipio: "ASC" },
        });
    }

    findAll(): Promise<CotaGeralMunicipio[]> {
        return this.repo.find({ order: { uf: "ASC", nomeMunicipio: "ASC" } });
    }

    async updateById(
        id: number,
        data: Partial<Pick<CotaGeralMunicipio, "van" | "ambulancia" | "microonibus">>,
    ): Promise<CotaGeralMunicipio> {
        await this.repo.update(id, data);
        return this.repo.findOneOrFail({ where: { id } });
    }
}
