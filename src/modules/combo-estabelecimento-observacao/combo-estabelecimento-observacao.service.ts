import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboEstabelecimentoObservacao } from "./entities/combo-estabelecimento-observacao.entity";

@Injectable()
export class ComboEstabelecimentoObservacaoService {
    constructor(
        @InjectRepository(ComboEstabelecimentoObservacao)
        private readonly repo: Repository<ComboEstabelecimentoObservacao>,
    ) {}

    /** Todas as observações — para enriquecer a listagem do frontend de uma vez (evita N+1 fetch por linha). */
    findAll(): Promise<ComboEstabelecimentoObservacao[]> {
        return this.repo.find({ order: { createdAt: "DESC" } });
    }

    /** Observações de um estabelecimento específico (por estabKey). */
    findByEstabKey(estabKey: string): Promise<ComboEstabelecimentoObservacao[]> {
        return this.repo.find({ where: { estabKey }, order: { createdAt: "DESC" } });
    }

    async create(estabKey: string, texto: string, autor: string): Promise<ComboEstabelecimentoObservacao> {
        const observacao = this.repo.create({ estabKey, texto: texto.trim(), autor });
        return this.repo.save(observacao);
    }

    async delete(id: number): Promise<void> {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException(`Observação ${id} não encontrada`);
        await this.repo.remove(item);
    }
}
