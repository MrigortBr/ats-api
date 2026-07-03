import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { HospitalService } from "./hospital.service";
import { Hospital } from "./entities/hospital.entity";
import { HospitalTomo } from "./entities/hospital-tomo.entity";
import { HospitalRnm } from "./entities/hospital-rnm.entity";
import { HospitalCombo } from "./entities/hospital-combo.entity";
import { Uf } from "../uf/entities/uf.entity";

// ─── helpers ──────────────────────────────────────────────────────────────────
function makeCombo(id: number, companyId: number | null): HospitalCombo {
    return {
        id,
        companyId,
        comboType: "TC-MULTISLICE",
        hospitalId: 1,
        hospital: { id: 1, name: "Hospital Teste", uf: { uf: "SP" } } as Hospital,
    } as HospitalCombo;
}

const CNES_MOCK = {
    cnes: "0000123",
    name: "Hospital Teste",
    municipality: "São Paulo",
    ufSigla: "SP",
};

// ─── suite ────────────────────────────────────────────────────────────────────
describe("HospitalService", () => {
    let service: HospitalService;
    let comboRepo: { find: jest.Mock; findOne: jest.Mock; softDelete: jest.Mock };
    let dataSource: { transaction: jest.Mock };

    beforeEach(async () => {
        comboRepo = {
            find:       jest.fn(),
            findOne:    jest.fn(),
            softDelete: jest.fn(),
        };
        dataSource = { transaction: jest.fn() };

        const repoStub = () => ({
            find:    jest.fn(),
            findOne: jest.fn(),
            save:    jest.fn(),
            create:  jest.fn(),
            softDelete: jest.fn(),
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HospitalService,
                { provide: getRepositoryToken(Hospital),      useValue: repoStub() },
                { provide: getRepositoryToken(HospitalTomo),  useValue: repoStub() },
                { provide: getRepositoryToken(HospitalRnm),   useValue: repoStub() },
                { provide: getRepositoryToken(HospitalCombo), useValue: comboRepo },
                { provide: getRepositoryToken(Uf),            useValue: repoStub() },
                { provide: DataSource,                        useValue: dataSource },
            ],
        }).compile();

        service = module.get<HospitalService>(HospitalService);
    });

    // ─── Cenário 1 — findAllCombo filtra por companyId ──────────────────────
    describe("findAllCombo — filtro multi-tenant", () => {
        it("passa where: { companyId } quando companyId é fornecido", async () => {
            comboRepo.find.mockResolvedValue([makeCombo(1, 42)]);

            await service.findAllCombo(42);

            expect(comboRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: { companyId: 42 } }),
            );
        });

        it("passa where: undefined quando companyId é null (retorna todos)", async () => {
            comboRepo.find.mockResolvedValue([makeCombo(1, 1), makeCombo(2, 2)]);

            await service.findAllCombo(null);

            expect(comboRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ where: undefined }),
            );
        });

        it("empresa A não enxerga combos da empresa B", async () => {
            const empresaACombos = [makeCombo(1, 1)];
            comboRepo.find.mockResolvedValue(empresaACombos);

            const result = await service.findAllCombo(1);

            expect(result).toEqual(empresaACombos);
            expect(result.every(c => c.companyId === 1)).toBe(true);
        });
    });

    // ─── Cenário 2 — findComboByUf filtra por UF + companyId ────────────────
    describe("findComboByUf — filtro por UF com multi-tenant", () => {
        it("inclui companyId no where quando fornecido", async () => {
            comboRepo.find.mockResolvedValue([]);

            await service.findComboByUf("SP", 5);

            expect(comboRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { hospital: { uf: { uf: "SP" } }, companyId: 5 },
                }),
            );
        });

        it("filtra só por UF quando companyId é null", async () => {
            comboRepo.find.mockResolvedValue([]);

            await service.findComboByUf("RJ", null);

            expect(comboRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { hospital: { uf: { uf: "RJ" } } },
                }),
            );
        });
    });

    // ─── Cenário 3 — createCombo persiste companyId ──────────────────────────
    describe("createCombo — companyId multi-tenant", () => {
        it("cria o combo com companyId correto", async () => {
            const companyId = 7;
            const savedCombo = makeCombo(10, companyId);

            // Transação executa o callback com um entity-manager mock
            const em = {
                findOne:       jest.fn().mockResolvedValue({ id: 1, cnes: "0000123" } as Hospital),
                create:        jest.fn().mockReturnValue({ companyId }),
                save:          jest.fn().mockResolvedValue({ id: 10 }),
                findOneOrFail: jest.fn().mockResolvedValue(savedCombo),
            };
            dataSource.transaction.mockImplementation((cb: (em: typeof em) => Promise<unknown>) => cb(em));

            // Stub da chamada externa CNES
            jest.spyOn(service as any, "fetchCnes").mockResolvedValue(CNES_MOCK);

            const result = await service.createCombo(
                { cnes: "0000123", comboType: "TC-MULTISLICE" } as any,
                companyId,
            );

            expect(em.create).toHaveBeenCalledWith(
                HospitalCombo,
                expect.objectContaining({ companyId }),
            );
            expect(result.companyId).toBe(companyId);
        });

        it("cria o combo com companyId null quando não fornecido", async () => {
            const savedCombo = makeCombo(11, null);

            const em = {
                findOne:       jest.fn().mockResolvedValue({ id: 1, cnes: "0000123" } as Hospital),
                create:        jest.fn().mockReturnValue({ companyId: null }),
                save:          jest.fn().mockResolvedValue({ id: 11 }),
                findOneOrFail: jest.fn().mockResolvedValue(savedCombo),
            };
            dataSource.transaction.mockImplementation((cb: (em: typeof em) => Promise<unknown>) => cb(em));
            jest.spyOn(service as any, "fetchCnes").mockResolvedValue(CNES_MOCK);

            const result = await service.createCombo(
                { cnes: "0000123", comboType: "TC-MULTISLICE" } as any,
            );

            expect(em.create).toHaveBeenCalledWith(
                HospitalCombo,
                expect.objectContaining({ companyId: null }),
            );
            expect(result.companyId).toBeNull();
        });
    });
});
