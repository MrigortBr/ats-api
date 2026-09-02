import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { CibMunicipio } from "./entities/cib-municipio.entity";

@Injectable()
export class CibMunicipioService {
    constructor(
        @InjectRepository(CibMunicipio)
        private readonly repo: Repository<CibMunicipio>,
    ) {}

    findByUf(uf: string): Promise<CibMunicipio[]> {
        return this.repo.find({
            where: { uf: uf.toUpperCase() },
            order: { nomeMunicipio: "ASC" },
        });
    }

    findAll(): Promise<CibMunicipio[]> {
        return this.repo.find({ order: { uf: "ASC", nomeMunicipio: "ASC" } });
    }

    async updateById(
        id: number,
        data: Partial<
            Pick<
                CibMunicipio,
                "nomeMunicipio" | "regiaoSaude" | "radioterapia" | "trsHemodialise" | "veiculos" | "ibge"
            >
        >,
    ): Promise<CibMunicipio> {
        await this.repo.update(id, data);
        return this.repo.findOneOrFail({ where: { id } });
    }
}
