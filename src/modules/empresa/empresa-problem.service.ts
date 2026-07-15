import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";
import { EmpresaProblem } from "./entities/empresa-problem.entity";
import {
    CreateEmpresaProblemDto,
    UpdateEmpresaProblemDto,
} from "./dto/empresa.dto";

@Injectable()
export class EmpresaProblemService {
    constructor(
        @InjectRepository(ComboConsult)
        private readonly consultRepo: Repository<ComboConsult>,
        @InjectRepository(EmpresaProblem)
        private readonly problemRepo: Repository<EmpresaProblem>,
    ) {}

    async findProblemas(companyId: number) {
        return this.problemRepo.find({
            where: { consult: { companyId } },
            relations: { consult: true },
            order: { createdAt: "DESC" },
        });
    }

    async findAdminProblemas(companyId: number) {
        return this.problemRepo.find({
            where: { consult: { companyId } },
            relations: { consult: true },
            order: { createdAt: "DESC" },
        });
    }

    async createProblem(dto: CreateEmpresaProblemDto, companyId: number) {
        const consult = await this.consultRepo.findOne({
            where: { id: dto.consultId, companyId },
        });
        if (!consult) throw new NotFoundException(`Registro ${dto.consultId} nao encontrado para esta empresa`);
        const problem = this.problemRepo.create({
            consultId:         dto.consultId,
            queixa:            dto.queixa            ?? null,
            motivoUnidade:     dto.motivoUnidade      ?? null,
            propostaSolucaoMs: dto.propostaSolucaoMs  ?? null,
            status:            dto.status             ?? null,
        });
        return this.problemRepo.save(problem);
    }

    async updateProblem(id: number, dto: UpdateEmpresaProblemDto, companyId: number) {
        const problem = await this.problemRepo.findOne({
            where: { id },
            relations: { consult: true },
        });
        if (!problem || problem.consult?.companyId !== companyId) {
            throw new NotFoundException(`Problema ${id} nao encontrado`);
        }
        Object.assign(problem, {
            queixa:            dto.queixa            ?? problem.queixa,
            motivoUnidade:     dto.motivoUnidade      ?? problem.motivoUnidade,
            propostaSolucaoMs: dto.propostaSolucaoMs  ?? problem.propostaSolucaoMs,
            status:            dto.status             ?? problem.status,
        });
        return this.problemRepo.save(problem);
    }

    async deleteProblem(id: number, companyId: number) {
        const problem = await this.problemRepo.findOne({
            where: { id },
            relations: { consult: true },
        });
        if (!problem || problem.consult?.companyId !== companyId) {
            throw new NotFoundException(`Problema ${id} nao encontrado`);
        }
        await this.problemRepo.softDelete(id);
    }
}
