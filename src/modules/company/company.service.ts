import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company } from "./entities/company.entity";

@Injectable()
export class CompanyService {
    constructor(
        @InjectRepository(Company)
        private readonly repo: Repository<Company>,
    ) {}

    findAll(): Promise<Company[]> {
        return this.repo.find({ order: { name: "ASC" } });
    }

    async findOne(id: number): Promise<Company> {
        const company = await this.repo.findOne({ where: { id } });
        if (!company) throw new NotFoundException(`Empresa ${id} não encontrada`);
        return company;
    }

    create(data: { name: string; cnpj?: string }): Promise<Company> {
        const company = this.repo.create(data);
        return this.repo.save(company);
    }

    async update(id: number, data: { name?: string; cnpj?: string }): Promise<Company> {
        await this.findOne(id);
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.findOne(id);
        await this.repo.softDelete(id);
    }
}
