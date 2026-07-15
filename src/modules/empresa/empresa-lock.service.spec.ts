import { ConflictException, NotFoundException } from "@nestjs/common";
import { Repository, UpdateResult } from "typeorm";
import { EmpresaLockService, LOCK_TTL_MINUTES } from "./empresa-lock.service";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";

// ─── Fábrica de mock do Repository ───────────────────────────────────────────

function makeRepo(overrides: Partial<Record<keyof Repository<ComboConsult>, unknown>> = {}) {
    return {
        findOne: jest.fn(),
        save:    jest.fn(),
        update:  jest.fn(),
        ...overrides,
    } as unknown as Repository<ComboConsult>;
}

function makeConsult(partial: Partial<ComboConsult> = {}): ComboConsult {
    return {
        id:        1,
        lockedBy:  null,
        lockedAt:  null,
        comboCode: "ADV_0001",
        ...partial,
    } as ComboConsult;
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("EmpresaLockService", () => {
    let repo: Repository<ComboConsult>;
    let service: EmpresaLockService;

    beforeEach(() => {
        repo = makeRepo();
        service = new EmpresaLockService(repo);
    });

    // ── lockEquipamento ────────────────────────────────────────────────────────

    describe("lockEquipamento", () => {
        it("deve adquirir lock quando registro nao esta bloqueado", async () => {
            const consult = makeConsult();
            (repo.findOne as jest.Mock).mockResolvedValue(consult);
            (repo.save    as jest.Mock).mockResolvedValue(consult);

            const result = await service.lockEquipamento(1, "user@test.com");

            expect(result.lockedBy).toBe("user@test.com");
            expect(result.lockedAt).toBeInstanceOf(Date);
            expect(repo.save).toHaveBeenCalledWith(
                expect.objectContaining({ lockedBy: "user@test.com" }),
            );
        });

        it("deve renovar lock do proprio usuario", async () => {
            const consult = makeConsult({ lockedBy: "user@test.com", lockedAt: new Date() });
            (repo.findOne as jest.Mock).mockResolvedValue(consult);
            (repo.save    as jest.Mock).mockResolvedValue(consult);

            await expect(service.lockEquipamento(1, "user@test.com")).resolves.not.toThrow();
        });

        it("deve lancar NotFoundException quando registro nao existe", async () => {
            (repo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.lockEquipamento(99, "user@test.com")).rejects.toThrow(NotFoundException);
        });

        it("deve lancar ConflictException quando bloqueado por outro usuario", async () => {
            const consult = makeConsult({ lockedBy: "outro@test.com", lockedAt: new Date() });
            (repo.findOne as jest.Mock).mockResolvedValue(consult);

            await expect(service.lockEquipamento(1, "user@test.com")).rejects.toThrow(ConflictException);
        });

        it("ConflictException deve conter o email do usuario que possui o lock", async () => {
            const consult = makeConsult({ lockedBy: "owner@test.com", lockedAt: new Date() });
            (repo.findOne as jest.Mock).mockResolvedValue(consult);

            try {
                await service.lockEquipamento(1, "user@test.com");
                fail("deveria ter lancado ConflictException");
            } catch (e) {
                expect(e).toBeInstanceOf(ConflictException);
                const body = (e as ConflictException).getResponse() as { lockedBy: string };
                expect(body.lockedBy).toBe("owner@test.com");
            }
        });
    });

    // ── unlockEquipamento ──────────────────────────────────────────────────────

    describe("unlockEquipamento", () => {
        it("deve liberar lock do proprio usuario", async () => {
            const consult = makeConsult({ lockedBy: "user@test.com", lockedAt: new Date() });
            (repo.findOne as jest.Mock).mockResolvedValue(consult);
            (repo.save    as jest.Mock).mockResolvedValue(consult);

            await service.unlockEquipamento(1, "user@test.com");

            expect(repo.save).toHaveBeenCalledWith(
                expect.objectContaining({ lockedBy: null, lockedAt: null }),
            );
        });

        it("deve ser no-op quando o registro nao existe", async () => {
            (repo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.unlockEquipamento(99, "user@test.com")).resolves.not.toThrow();
            expect(repo.save).not.toHaveBeenCalled();
        });

        it("deve ser no-op quando o lock pertence a outro usuario", async () => {
            const consult = makeConsult({ lockedBy: "outro@test.com", lockedAt: new Date() });
            (repo.findOne as jest.Mock).mockResolvedValue(consult);

            await service.unlockEquipamento(1, "user@test.com");

            expect(repo.save).not.toHaveBeenCalled();
        });
    });

    // ── releaseExpiredLocks ────────────────────────────────────────────────────

    describe("releaseExpiredLocks", () => {
        it("deve chamar update com cutoff correto e limpar lock", async () => {
            const updateResult: UpdateResult = { affected: 3, raw: [], generatedMaps: [] };
            (repo.update as jest.Mock).mockResolvedValue(updateResult);

            const before = Date.now();
            await service.releaseExpiredLocks();
            const after  = Date.now();

            expect(repo.update).toHaveBeenCalledTimes(1);

            const [where, set] = (repo.update as jest.Mock).mock.calls[0] as [
                { lockedAt: { _value: Date } },
                { lockedBy: null; lockedAt: null },
            ];

            // O cutoff deve estar dentro do intervalo esperado
            const cutoffMs = (where.lockedAt as unknown as { _value: Date })._value?.getTime()
                ?? NaN;
            const expectedCutoff = before - LOCK_TTL_MINUTES * 60 * 1_000;
            expect(cutoffMs).toBeGreaterThanOrEqual(expectedCutoff - 100);
            expect(cutoffMs).toBeLessThanOrEqual(after - LOCK_TTL_MINUTES * 60 * 1_000 + 100);

            expect(set).toEqual({ lockedBy: null, lockedAt: null });
        });

        it("deve ser no-op silencioso quando nenhum lock expirou", async () => {
            const updateResult: UpdateResult = { affected: 0, raw: [], generatedMaps: [] };
            (repo.update as jest.Mock).mockResolvedValue(updateResult);

            await expect(service.releaseExpiredLocks()).resolves.not.toThrow();
        });
    });
});
