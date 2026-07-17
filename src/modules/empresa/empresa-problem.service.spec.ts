import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { EmpresaProblemService } from "./empresa-problem.service";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";
import { EmpresaProblem } from "./entities/empresa-problem.entity";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRepo<T>(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        findOne:    jest.fn(),
        find:       jest.fn(),
        save:       jest.fn(),
        create:     jest.fn((dto: Partial<T>) => dto as T),
        softDelete: jest.fn(),
        ...overrides,
    } as unknown as Repository<T>;
}

function makeConsult(id: number, companyId: number): ComboConsult {
    return { id, companyId } as ComboConsult;
}

function makeProblem(id: number, companyId: number): EmpresaProblem {
    return {
        id,
        consultId:         1,
        queixa:            "Equipamento sem funcionar",
        motivoUnidade:     null,
        propostaSolucaoMs: null,
        status:            "aberto",
        consult:           makeConsult(1, companyId),
    } as unknown as EmpresaProblem;
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("EmpresaProblemService", () => {
    let consultRepo: Repository<ComboConsult>;
    let problemRepo: Repository<EmpresaProblem>;
    let service:     EmpresaProblemService;

    beforeEach(() => {
        consultRepo = makeRepo<ComboConsult>();
        problemRepo = makeRepo<EmpresaProblem>();
        service     = new EmpresaProblemService(consultRepo, problemRepo);
    });

    // ── findProblemas ──────────────────────────────────────────────────────────

    describe("findProblemas", () => {
        it("filtra por companyId via relação consult", async () => {
            (problemRepo.find as jest.Mock).mockResolvedValue([makeProblem(1, 5)]);

            const result = await service.findProblemas(5);

            expect(problemRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: { consult: { companyId: 5 } } }),
            );
            expect(result).toHaveLength(1);
        });

        it("retorna array vazio quando não há problemas", async () => {
            (problemRepo.find as jest.Mock).mockResolvedValue([]);

            const result = await service.findProblemas(99);
            expect(result).toHaveLength(0);
        });
    });

    // ── createProblem ──────────────────────────────────────────────────────────

    describe("createProblem", () => {
        it("cria problema quando o consult pertence à empresa", async () => {
            const consult = makeConsult(1, 5);
            const problem = makeProblem(10, 5);
            (consultRepo.findOne as jest.Mock).mockResolvedValue(consult);
            (problemRepo.save    as jest.Mock).mockResolvedValue(problem);

            const result = await service.createProblem(
                { consultId: 1, queixa: "Equipamento sem funcionar" } as any,
                5,
            );

            expect(result).toEqual(problem);
            expect(problemRepo.save).toHaveBeenCalled();
        });

        it("lança NotFoundException quando consult não pertence à empresa", async () => {
            (consultRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.createProblem({ consultId: 99, queixa: "X" } as any, 5),
            ).rejects.toThrow(NotFoundException);
        });

        it("persiste campos opcionais como null quando não fornecidos", async () => {
            const consult = makeConsult(1, 5);
            (consultRepo.findOne as jest.Mock).mockResolvedValue(consult);
            (problemRepo.save    as jest.Mock).mockImplementation((p) => Promise.resolve(p));

            await service.createProblem({ consultId: 1 } as any, 5);

            expect(problemRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    queixa:            null,
                    motivoUnidade:     null,
                    propostaSolucaoMs: null,
                    status:            null,
                }),
            );
        });
    });

    // ── updateProblem ──────────────────────────────────────────────────────────

    describe("updateProblem", () => {
        it("atualiza problema da própria empresa", async () => {
            const problem = makeProblem(1, 5);
            (problemRepo.findOne as jest.Mock).mockResolvedValue(problem);
            (problemRepo.save    as jest.Mock).mockImplementation(p => Promise.resolve(p));

            const updated = await service.updateProblem(1, { status: "resolvido" } as any, 5);
            expect(updated.status).toBe("resolvido");
        });

        it("lança NotFoundException quando problema não existe", async () => {
            (problemRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.updateProblem(999, { status: "x" } as any, 5),
            ).rejects.toThrow(NotFoundException);
        });

        it("lança NotFoundException quando problema pertence a outra empresa (escopo cruzado)", async () => {
            const problem = makeProblem(1, 99); // companyId 99 ≠ 5
            (problemRepo.findOne as jest.Mock).mockResolvedValue(problem);

            await expect(
                service.updateProblem(1, { status: "x" } as any, 5),
            ).rejects.toThrow(NotFoundException);
        });

        it("mantém campos não fornecidos com valor original", async () => {
            const problem = makeProblem(1, 5);
            (problemRepo.findOne as jest.Mock).mockResolvedValue(problem);
            (problemRepo.save    as jest.Mock).mockImplementation(p => Promise.resolve(p));

            const updated = await service.updateProblem(1, {} as any, 5);
            // campos não enviados devem permanecer iguais ao original
            expect(updated.queixa).toBe(problem.queixa);
        });
    });

    // ── deleteProblem ──────────────────────────────────────────────────────────

    describe("deleteProblem", () => {
        it("soft-deleta problema da própria empresa", async () => {
            const problem = makeProblem(1, 5);
            (problemRepo.findOne   as jest.Mock).mockResolvedValue(problem);
            (problemRepo.softDelete as jest.Mock).mockResolvedValue(undefined);

            await service.deleteProblem(1, 5);
            expect(problemRepo.softDelete).toHaveBeenCalledWith(1);
        });

        it("lança NotFoundException quando problema não existe", async () => {
            (problemRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.deleteProblem(999, 5)).rejects.toThrow(NotFoundException);
        });

        it("bloqueia exclusão de problema de outra empresa", async () => {
            const problem = makeProblem(1, 99); // outra empresa
            (problemRepo.findOne as jest.Mock).mockResolvedValue(problem);

            await expect(service.deleteProblem(1, 5)).rejects.toThrow(NotFoundException);
            expect(problemRepo.softDelete).not.toHaveBeenCalled();
        });
    });
});
