import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { HospitalService } from "./hospital.service";
import { Hospital } from "./entities/hospital.entity";
import { HospitalTomo } from "./entities/hospital-tomo.entity";
import { HospitalRnm } from "./entities/hospital-rnm.entity";
import { Uf } from "../uf/entities/uf.entity";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeHospital(partial: Partial<Hospital> = {}): Hospital {
    return {
        id: 1, name: "Hospital Teste",
        cnes: "0000123", gestao: null, naturezaJuridica: null,
        uf: { id: 1, uf: "SP" } as Uf,
        ...partial,
    } as Hospital;
}

function makeTomo(partial: Partial<HospitalTomo> = {}): HospitalTomo {
    return {
        id: 1, hospitalId: 1,
        hospital: makeHospital(),
        ...partial,
    } as HospitalTomo;
}

function makeRnm(partial: Partial<HospitalRnm> = {}): HospitalRnm {
    return {
        id: 2, hospitalId: 1,
        hospital: makeHospital(),
        ...partial,
    } as HospitalRnm;
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("HospitalService", () => {
    let service: HospitalService;
    let hospitalRepo: { findOne: jest.Mock; save: jest.Mock };
    let tomoRepo:     { findOne: jest.Mock; find: jest.Mock; save: jest.Mock; softDelete: jest.Mock };
    let rnmRepo:      { findOne: jest.Mock; find: jest.Mock; save: jest.Mock; softDelete: jest.Mock };

    beforeEach(async () => {
        hospitalRepo = { findOne: jest.fn(), save: jest.fn() };
        tomoRepo     = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), softDelete: jest.fn() };
        rnmRepo      = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), softDelete: jest.fn() };

        const repoStub = () => ({
            find: jest.fn(), findOne: jest.fn(), save: jest.fn(),
            create: jest.fn(), softDelete: jest.fn(),
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HospitalService,
                { provide: getRepositoryToken(Hospital),     useValue: hospitalRepo },
                { provide: getRepositoryToken(HospitalTomo), useValue: tomoRepo },
                { provide: getRepositoryToken(HospitalRnm),  useValue: rnmRepo },
                { provide: getRepositoryToken(Uf),           useValue: repoStub() },
                { provide: DataSource,                       useValue: { transaction: jest.fn() } },
            ],
        }).compile();

        service = module.get<HospitalService>(HospitalService);
    });

    // ── findAllTomo ────────────────────────────────────────────────────────────

    describe("findAllTomo", () => {
        it("retorna todos os registros TOMO com relações", async () => {
            const tomos = [makeTomo()];
            tomoRepo.find.mockResolvedValue(tomos);

            const result = await service.findAllTomo();

            expect(result).toEqual(tomos);
            expect(tomoRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ relations: { hospital: { uf: true } } }),
            );
        });

        it("retorna array vazio quando não há registros", async () => {
            tomoRepo.find.mockResolvedValue([]);
            const result = await service.findAllTomo();
            expect(result).toHaveLength(0);
        });
    });

    // ── findTomoByUf ──────────────────────────────────────────────────────────

    describe("findTomoByUf", () => {
        it("filtra por UF corretamente", async () => {
            tomoRepo.find.mockResolvedValue([makeTomo()]);

            await service.findTomoByUf("SP");

            expect(tomoRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { hospital: { uf: { uf: "SP" } } },
                }),
            );
        });
    });

    // ── findAllRnm ────────────────────────────────────────────────────────────

    describe("findAllRnm", () => {
        it("retorna todos os registros RNM com relações", async () => {
            const rnms = [makeRnm()];
            rnmRepo.find.mockResolvedValue(rnms);

            const result = await service.findAllRnm();

            expect(result).toEqual(rnms);
            expect(rnmRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ relations: { hospital: { uf: true } } }),
            );
        });
    });

    // ── findRnmByUf ───────────────────────────────────────────────────────────

    describe("findRnmByUf", () => {
        it("filtra por UF corretamente", async () => {
            rnmRepo.find.mockResolvedValue([makeRnm()]);

            await service.findRnmByUf("RJ");

            expect(rnmRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { hospital: { uf: { uf: "RJ" } } },
                }),
            );
        });
    });

    // ── softDeleteTomo ────────────────────────────────────────────────────────

    describe("softDeleteTomo", () => {
        it("soft-deleta registro TOMO existente", async () => {
            tomoRepo.findOne.mockResolvedValue(makeTomo());
            tomoRepo.softDelete.mockResolvedValue(undefined);

            await service.softDeleteTomo(1);
            expect(tomoRepo.softDelete).toHaveBeenCalledWith(1);
        });

        it("lança NotFoundException quando registro não existe", async () => {
            tomoRepo.findOne.mockResolvedValue(null);
            await expect(service.softDeleteTomo(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ── softDeleteRnm ─────────────────────────────────────────────────────────

    describe("softDeleteRnm", () => {
        it("soft-deleta registro RNM existente", async () => {
            rnmRepo.findOne.mockResolvedValue(makeRnm());
            rnmRepo.softDelete.mockResolvedValue(undefined);

            await service.softDeleteRnm(2);
            expect(rnmRepo.softDelete).toHaveBeenCalledWith(2);
        });

        it("lança NotFoundException quando registro não existe", async () => {
            rnmRepo.findOne.mockResolvedValue(null);
            await expect(service.softDeleteRnm(999)).rejects.toThrow(NotFoundException);
        });
    });

    // ── updateHospital ────────────────────────────────────────────────────────

    describe("updateHospital", () => {
        it("atualiza campos do hospital", async () => {
            const hospital = makeHospital();
            hospitalRepo.findOne.mockResolvedValue(hospital);
            hospitalRepo.save.mockImplementation(h => Promise.resolve(h));

            const updated = await service.updateHospital(1, { gestao: "Municipal" } as any);
            expect(updated.gestao).toBe("Municipal");
        });

        it("lança NotFoundException quando hospital não existe", async () => {
            hospitalRepo.findOne.mockResolvedValue(null);
            await expect(service.updateHospital(999, {})).rejects.toThrow(NotFoundException);
        });
    });

    // ── updateTomo ────────────────────────────────────────────────────────────

    describe("updateTomo", () => {
        it("normaliza CNES para 7 dígitos ao atualizar", async () => {
            const tomo = makeTomo({ hospital: makeHospital({ cnes: "0000123" }) });
            tomoRepo.findOne.mockResolvedValue(tomo);
            hospitalRepo.save.mockResolvedValue(tomo.hospital);
            tomoRepo.save.mockImplementation(r => Promise.resolve(r));

            await service.updateTomo(1, { cnes: "3832" } as any);

            expect(tomo.hospital.cnes).toBe("0003832");
        });

        it("lança NotFoundException quando TOMO não existe", async () => {
            tomoRepo.findOne.mockResolvedValue(null);
            await expect(service.updateTomo(999, {})).rejects.toThrow(NotFoundException);
        });

        it("não salva hospital quando nenhum campo do hospital é alterado", async () => {
            const tomo = makeTomo();
            tomoRepo.findOne.mockResolvedValue(tomo);
            tomoRepo.save.mockImplementation(r => Promise.resolve(r));

            await service.updateTomo(1, { deliveryStatus: "Entregue" } as any);

            expect(hospitalRepo.save).not.toHaveBeenCalled();
        });
    });

    // ── updateRnm ─────────────────────────────────────────────────────────────

    describe("updateRnm", () => {
        it("lança NotFoundException quando RNM não existe", async () => {
            rnmRepo.findOne.mockResolvedValue(null);
            await expect(service.updateRnm(999, {})).rejects.toThrow(NotFoundException);
        });

        it("atualiza campos RNM sem tocar no hospital quando desnecessário", async () => {
            const rnm = makeRnm();
            rnmRepo.findOne.mockResolvedValue(rnm);
            rnmRepo.save.mockImplementation(r => Promise.resolve(r));

            await service.updateRnm(1, { deliveryStatus: "Instalado" } as any);

            expect(hospitalRepo.save).not.toHaveBeenCalled();
        });
    });
});
