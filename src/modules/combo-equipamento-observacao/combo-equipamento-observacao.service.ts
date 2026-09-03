import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboEquipamentoObservacao } from "./entities/combo-equipamento-observacao.entity";

@Injectable()
export class ComboEquipamentoObservacaoService {
    constructor(
        @InjectRepository(ComboEquipamentoObservacao)
        private readonly repo: Repository<ComboEquipamentoObservacao>,
    ) {}

    /** Todas as observações — para enriquecer a listagem do frontend de uma vez (evita N+1 fetch por linha). */
    findAll(): Promise<ComboEquipamentoObservacao[]> {
        return this.repo.find({ order: { createdAt: "DESC" } });
    }

    /** Observações de um equipamento específico (por equipKey). */
    findByEquipKey(equipKey: string): Promise<ComboEquipamentoObservacao[]> {
        return this.repo.find({ where: { equipKey }, order: { createdAt: "DESC" } });
    }

    async create(equipKey: string, texto: string, autor: string): Promise<ComboEquipamentoObservacao> {
        const observacao = this.repo.create({ equipKey, texto: texto.trim(), autor });
        return this.repo.save(observacao);
    }

    async delete(id: number): Promise<void> {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException(`Observação ${id} não encontrada`);
        await this.repo.remove(item);
    }
}
