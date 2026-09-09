import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { EquipamentoConvenioSisconv } from "./entities/equipamento-convenio-sisconv.entity";
import { EquipamentoConvenioSispro } from "./entities/equipamento-convenio-sispro.entity";
import { ImportSisconvRowDto, ImportSisproRowDto } from "./dto/import-equipamento-convenio.dto";

@Injectable()
export class EquipamentoConvenioService {
    constructor(
        @InjectRepository(EquipamentoConvenioSisconv)
        private readonly sisconvRepo: Repository<EquipamentoConvenioSisconv>,
        @InjectRepository(EquipamentoConvenioSispro)
        private readonly sisproRepo: Repository<EquipamentoConvenioSispro>,
        private readonly dataSource: DataSource,
    ) {}

    findAllSisconv(): Promise<EquipamentoConvenioSisconv[]> {
        return this.sisconvRepo.find({ order: { equipamento: "ASC", uf: "ASC", entidade: "ASC" } });
    }

    findAllSispro(): Promise<EquipamentoConvenioSispro[]> {
        return this.sisproRepo.find({ order: { equipamento: "ASC", pendente: "ASC", uf: "ASC" } });
    }

    /** Substitui todo o conteúdo da tabela SISCONV — usado ao subir uma planilha nova (admin). */
    async replaceSisconv(rows: ImportSisconvRowDto[]): Promise<{ imported: number }> {
        await this.dataSource.transaction(async (manager) => {
            await manager.clear(EquipamentoConvenioSisconv);
            const entities = rows.map((r) =>
                manager.create(EquipamentoConvenioSisconv, {
                    equipamento: r.equipamento.trim(),
                    convenio: r.convenio.trim(),
                    entidade: r.entidade.trim(),
                    uf: r.uf.trim().toUpperCase(),
                    municipio: r.municipio.trim(),
                    dataPublicacao: r.dataPublicacao ?? null,
                    valorGlobal: r.valorGlobal != null ? String(r.valorGlobal) : null,
                    situacao: r.situacao.trim(),
                }),
            );
            await manager.save(EquipamentoConvenioSisconv, entities);
        });
        return { imported: rows.length };
    }

    /** Substitui todo o conteúdo da tabela SISPRO — usado ao subir uma planilha nova (admin). */
    async replaceSispro(rows: ImportSisproRowDto[]): Promise<{ imported: number }> {
        await this.dataSource.transaction(async (manager) => {
            await manager.clear(EquipamentoConvenioSispro);
            const entities = rows.map((r) => {
                const uf = r.uf?.trim() || null;
                const entidade = r.entidade?.trim() || null;
                return manager.create(EquipamentoConvenioSispro, {
                    equipamento: r.equipamento.trim(),
                    regiao: r.regiao?.trim() || null,
                    uf: uf ? uf.toUpperCase() : null,
                    municipio: r.municipio?.trim() || null,
                    entidade,
                    nuProposta: r.nuProposta?.trim() || null,
                    nuProcesso: r.nuProcesso?.trim() || null,
                    convenio: r.convenio?.trim() || null,
                    ano: r.ano?.trim() || null,
                    pendente: r.pendente ?? (!uf || !entidade),
                });
            });
            await manager.save(EquipamentoConvenioSispro, entities);
        });
        return { imported: rows.length };
    }
}
