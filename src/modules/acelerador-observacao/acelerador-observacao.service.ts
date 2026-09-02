import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AceleradorObservacao } from "./entities/acelerador-observacao.entity";

@Injectable()
export class AceleradorObservacaoService {
    constructor(
        @InjectRepository(AceleradorObservacao)
        private readonly repo: Repository<AceleradorObservacao>,
    ) {}

    /** Todas as observações — para enriquecer a listagem do frontend de uma vez (evita N+1 fetch por linha). */
    findAll(): Promise<AceleradorObservacao[]> {
        return this.repo.find({ order: { createdAt: "DESC" } });
    }

    /** Observações de um estabelecimento específico (por CNES). */
    findByCnes(cnes: string): Promise<AceleradorObservacao[]> {
        return this.repo.find({ where: { cnes }, order: { createdAt: "DESC" } });
    }

    async create(cnes: string, texto: string, autor: string): Promise<AceleradorObservacao> {
        const observacao = this.repo.create({ cnes, texto: texto.trim(), autor });
        return this.repo.save(observacao);
    }

    async delete(id: number): Promise<void> {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException(`Observação ${id} não encontrada`);
        await this.repo.remove(item);
    }
}
