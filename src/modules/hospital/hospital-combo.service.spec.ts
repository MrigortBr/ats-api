import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { HospitalComboService } from "./hospital-combo.service";
import { ComboConsult } from "./entities/combo-consult.entity";
import { Hospital } from "./entities/hospital.entity";

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

function makeConsult(partial: Partial<ComboConsult> = {}): ComboConsult {
    return { id: 1, companyId: 5, comboType: "COMBO CIRURGIA", ...partial } as ComboConsult;
}

function makeHospital(cnes: string): Hospital {
    return { id: 10, cnes } as Hospital;
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("HospitalComboService", () => {
    let consultRepo: Repository<ComboConsult>;
    let hospitalRepo: Repository<Hospital>;
    let service: HospitalComboService;

    beforeEach(() => {
        consultRepo  = makeRepo<ComboConsult>();
        hospitalRepo = makeRepo<Hospital>();
        service      = new HospitalComboService(consultRepo, hospitalRepo);
    });

    // ── createCombo — CNES normalização ───────────────────────────────────────

    describe("createCombo — normalização de CNES", () => {
        it("resolve hospitalId a partir do CNES quando hospital existe", async () => {
            const hospital = makeHospital("0003832");
            (hospitalRepo.findOne as jest.Mock).mockResolvedValue(hospital);
            (consultRepo.save     as jest.Mock).mockResolvedValue(makeConsult({ hospitalId: 10 }));

            const result = await service.createCombo({ cnes: "3832", comboType: "COMBO CIRURGIA" } as any, 5);
            // CNES deve ser normalizado: "3832" → "0003832"
            expect(hospitalRepo.findOne).toHaveBeenCalledWith({ where: { cnes: "0003832" } });
            expect(result.hospitalId).toBe(10);
        });

        it("hospitalId fica null quando CNES não é encontrado", async () => {
            (hospitalRepo.findOne as jest.Mock).mockResolvedValue(null);
            (consultRepo.save     as jest.Mock).mockResolvedValue(makeConsult({ hospitalId: null }));

            const result = await service.createCombo({ cnes: "9999999", comboType: "COMBO CIRURGIA" } as any);
            expect(result.hospitalId).toBeNull();
        });

        it("não consulta hospital quando CNES não é fornecido", async () => {
            (consultRepo.save as jest.Mock).mockResolvedValue(makeConsult({ hospitalId: null }));

            await service.createCombo({ comboType: "COMBO CIRURGIA" } as any);
            expect(hospitalRepo.findOne).not.toHaveBeenCalled();
        });

        it("prioriza companyId do parâmetro sobre o do DTO", async () => {
            (hospitalRepo.findOne as jest.Mock).mockResolvedValue(null);
            (consultRepo.save     as jest.Mock).mockImplementation(r => Promise.resolve(r));

            await service.createCombo(
                { comboType: "COMBO CIRURGIA", companyId: 99 } as any,
                5, // parâmetro deve vencer
            );

            expect(consultRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ companyId: 5 }),
            );
        });
    });

    // ── findAllCombo — filtro multi-tenant ─────────────────────────────────────

    describe("findAllCombo", () => {
        it("passa where: { companyId } quando companyId é fornecido", async () => {
            (consultRepo.find as jest.Mock).mockResolvedValue([]);

            await service.findAllCombo(7);
            expect(consultRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: { companyId: 7 } }),
            );
        });

        it("passa where: undefined quando companyId é null (retorna todos)", async () => {
            (consultRepo.find as jest.Mock).mockResolvedValue([]);

            await service.findAllCombo(null);
            expect(consultRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: undefined }),
            );
        });
    });

    // ── findComboByUf ──────────────────────────────────────────────────────────

    describe("findComboByUf", () => {
        it("inclui companyId no where quando fornecido", async () => {
            (consultRepo.find as jest.Mock).mockResolvedValue([]);

            await service.findComboByUf("SP", 3);
            expect(consultRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: { uf: "SP", companyId: 3 } }),
            );
        });

        it("filtra só por UF quando companyId é null", async () => {
            (consultRepo.find as jest.Mock).mockResolvedValue([]);

            await service.findComboByUf("RJ", null);
            expect(consultRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: { uf: "RJ" } }),
            );
        });
    });

    // ── updateCombo ────────────────────────────────────────────────────────────

    describe("updateCombo", () => {
        it("atualiza os campos do registro", async () => {
            const consult = makeConsult();
            (consultRepo.findOne as jest.Mock).mockResolvedValue(consult);
            (consultRepo.save    as jest.Mock).mockImplementation(r => Promise.resolve(r));

            const updated = await service.updateCombo(1, { deliveryStatus: "Entregue" } as any);
            expect(updated.deliveryStatus).toBe("Entregue");
        });

        it("lança NotFoundException quando registro não existe", async () => {
            (consultRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.updateCombo(999, {} as any)).rejects.toThrow(NotFoundException);
        });
    });

    // ── softDeleteCombo ────────────────────────────────────────────────────────

    describe("softDeleteCombo", () => {
        it("soft-deleta o registro", async () => {
            (consultRepo.findOne   as jest.Mock).mockResolvedValue(makeConsult());
            (consultRepo.softDelete as jest.Mock).mockResolvedValue(undefined);

            await service.softDeleteCombo(1);
            expect(consultRepo.softDelete).toHaveBeenCalledWith(1);
        });

        it("lança NotFoundException quando registro não existe", async () => {
            (consultRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.softDeleteCombo(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ── softDeleteEquipamento ──────────────────────────────────────────────────

    describe("softDeleteEquipamento", () => {
        it("soft-deleta o equipamento", async () => {
            (consultRepo.findOne   as jest.Mock).mockResolvedValue(makeConsult());
            (consultRepo.softDelete as jest.Mock).mockResolvedValue(undefined);

            await service.softDeleteEquipamento(1);
            expect(consultRepo.softDelete).toHaveBeenCalledWith(1);
        });

        it("lança NotFoundException quando equipamento não existe", async () => {
            (consultRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.softDeleteEquipamento(999)).rejects.toThrow(NotFoundException);
        });
    });
});
