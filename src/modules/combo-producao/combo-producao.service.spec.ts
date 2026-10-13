import type { Repository } from "typeorm";
import { ComboProducaoService } from "./combo-producao.service";
import type { ProducaoComboMensal } from "./entities/producao-combo-mensal.entity";

function criar(linhas: Partial<ProducaoComboMensal>[]) {
    const find = jest.fn().mockResolvedValue(linhas);
    const service = new ComboProducaoService({ find } as unknown as Repository<ProducaoComboMensal>);
    return { service, find };
}

describe("ComboProducaoService", () => {
    describe("porCnes", () => {
        it("completa o CNES com zeros à esquerda e devolve só grupo e meses", async () => {
            const { service, find } = criar([{ cnes: "0000434", grupo: "04", meses: { "202501": [10, 1000] } }]);
            const r = await service.porCnes(" 434 ");
            expect(find).toHaveBeenCalledWith({ where: { cnes: "0000434" }, order: { grupo: "ASC" } });
            expect(r).toEqual([{ grupo: "04", meses: { "202501": [10, 1000] } }]);
        });
    });

    describe("todos", () => {
        it("devolve cnes, grupo e meses de cada estabelecimento", async () => {
            const { service, find } = criar([
                { cnes: "0000434", grupo: "04", meses: { "202501": [10, 1000] } },
                { cnes: "0000999", grupo: "04", meses: {} },
            ]);
            const r = await service.todos();
            expect(find).toHaveBeenCalledWith({ order: { cnes: "ASC", grupo: "ASC" } });
            expect(r).toEqual([
                { cnes: "0000434", grupo: "04", meses: { "202501": [10, 1000] } },
                { cnes: "0000999", grupo: "04", meses: {} },
            ]);
        });

        it("lista vazia quando não há produção carregada", async () => {
            const { service } = criar([]);
            expect(await service.todos()).toEqual([]);
        });
    });
});
