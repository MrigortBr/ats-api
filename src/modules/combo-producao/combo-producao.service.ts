import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProducaoComboMensal, type ProducaoMes } from "./entities/producao-combo-mensal.entity";

export interface ProducaoComboView {
    grupo: string;
    meses: Record<string, ProducaoMes>;
}

export interface ProducaoComboCnesView extends ProducaoComboView {
    cnes: string;
}

@Injectable()
export class ComboProducaoService {
    constructor(@InjectRepository(ProducaoComboMensal) private readonly repo: Repository<ProducaoComboMensal>) {}

    /** Produção mensal do estabelecimento, por grupo de procedimentos. */
    async porCnes(cnes: string): Promise<ProducaoComboView[]> {
        const linhas = await this.repo.find({ where: { cnes: cnes.trim().padStart(7, "0") }, order: { grupo: "ASC" } });
        return linhas.map(l => ({ grupo: l.grupo, meses: l.meses }));
    }

    /** Produção mensal de todos os estabelecimentos (alimenta a coluna de média na lista do Combo). */
    async todos(): Promise<ProducaoComboCnesView[]> {
        const linhas = await this.repo.find({ order: { cnes: "ASC", grupo: "ASC" } });
        return linhas.map(l => ({ cnes: l.cnes, grupo: l.grupo, meses: l.meses }));
    }
}
