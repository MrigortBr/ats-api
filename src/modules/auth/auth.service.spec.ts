import { JwtService } from "@nestjs/jwt";

// uuid v14 é ESM — mockar antes de importar o service
let _jtiCounter = 0;
jest.mock("uuid", () => ({ v4: jest.fn(() => `jti-${++_jtiCounter}`) }));
jest.mock("bcrypt", () => ({ compare: jest.fn().mockResolvedValue(true) }));

import { AuthService } from "./auth.service";
import * as bcrypt from "bcrypt"; // mocked above
import { AuthRepository } from "./auth.repository";
import { InvalidCredentialsException } from "./exceptions/invalid.exception";
import { Users } from "./entities/user.entity";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeUser(partial: Partial<Users> = {}): Users {
    return {
        id:              1,
        name:            "João",
        surname:         "Silva",
        email:           "joao@example.com",
        password:        "$2b$10$hashedpassword",
        roleId:          2,
        companyId:       null,
        modulesOverride: [],
        roleEntity:      { roleModules: [] },
        ...partial,
    } as unknown as Users;
}

function makeRoleModule(module: string, canWrite = false, companyId: number | null = null) {
    return { module, canWrite, companyId };
}

function makeRepo(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        findByEmail: jest.fn(),
        findById:    jest.fn(),
        ...overrides,
    } as unknown as AuthRepository;
}

function makeJwtService(): jest.Mocked<JwtService> {
    return { sign: jest.fn().mockReturnValue("signed-token") } as unknown as jest.Mocked<JwtService>;
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("AuthService", () => {
    let authRepo:   AuthRepository;
    let jwtService: jest.Mocked<JwtService>;
    let service:    AuthService;

    beforeEach(() => {
        authRepo   = makeRepo();
        jwtService = makeJwtService();
        service    = new AuthService(authRepo, jwtService);

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    // ── login — casos de erro ──────────────────────────────────────────────────

    describe("login — falhas de credencial", () => {
        it("lança InvalidCredentialsException quando usuário não existe", async () => {
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(null);

            await expect(service.login({ login: "x@x.com", password: "wrong" }))
                .rejects.toThrow(InvalidCredentialsException);
        });

        it("lança InvalidCredentialsException quando senha não confere", async () => {
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(makeUser());
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ login: "joao@example.com", password: "wrong" }))
                .rejects.toThrow(InvalidCredentialsException);
        });
    });

    // ── login — token e payload ────────────────────────────────────────────────

    describe("login — sucesso", () => {
        it("retorna access_token e dados do usuário", async () => {
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(makeUser());

            const result = await service.login({ login: "joao@example.com", password: "123" });

            expect(result.access_token).toBe("signed-token");
            expect(result.user.email).toBe("joao@example.com");
            expect(result.user.id).toBe(1);
        });

        it("inclui jti único em cada chamada", async () => {
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(makeUser());

            await service.login({ login: "joao@example.com", password: "123" });
            await service.login({ login: "joao@example.com", password: "123" });

            const calls = jwtService.sign.mock.calls;
            expect(calls[0][0].jti).not.toBe(calls[1][0].jti);
        });

        it("mescla modulesOverride com roleModules sem duplicar", async () => {
            const user = makeUser({
                modulesOverride: ["combo", "extra"],
                roleEntity: { roleModules: [makeRoleModule("tomo"), makeRoleModule("combo")] },
            });
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(user);

            const result = await service.login({ login: "joao@example.com", password: "123" });

            expect(result.user.modules).toEqual(expect.arrayContaining(["tomo", "combo", "extra"]));
            expect(result.user.modules.filter((m: string) => m === "combo")).toHaveLength(1);
        });

        it("writeModules contem apenas modulos com canWrite = true", async () => {
            const user = makeUser({
                roleEntity: {
                    roleModules: [
                        makeRoleModule("tomo",    true),
                        makeRoleModule("combo",   false),
                        makeRoleModule("empresa", true),
                    ],
                },
            });
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(user);

            const result = await service.login({ login: "joao@example.com", password: "123" });

            expect(result.user.writeModules).toEqual(expect.arrayContaining(["tomo", "empresa"]));
            expect(result.user.writeModules).not.toContain("combo");
        });
    });

    // buildCompanyScopes

    describe("login - buildCompanyScopes", () => {
        it("gestor_geral (companyId null + rm.companyId null) -> scope null (irrestrito)", async () => {
            const user = makeUser({
                companyId: null,
                roleEntity: { roleModules: [makeRoleModule("tomo", false, null)] },
            });
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(user);

            const result = await service.login({ login: "joao@example.com", password: "123" });

            expect(result.user.companyScopes["tomo"]).toBeNull();
        });

        it("funcionario (companyId 5 + rm.companyId null) -> scope [5]", async () => {
            const user = makeUser({
                companyId: 5,
                roleEntity: { roleModules: [makeRoleModule("tomo", false, null)] },
            });
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(user);

            const result = await service.login({ login: "joao@example.com", password: "123" });

            expect(result.user.companyScopes["tomo"]).toEqual([5]);
        });

        it("override explicito (rm.companyId = 7) -> scope [7] independente do user.companyId", async () => {
            const user = makeUser({
                companyId: 5,
                roleEntity: { roleModules: [makeRoleModule("combo", false, 7)] },
            });
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(user);

            const result = await service.login({ login: "joao@example.com", password: "123" });

            expect(result.user.companyScopes["combo"]).toEqual([7]);
        });

        it("multiplos modulos recebem escopos independentes", async () => {
            const user = makeUser({
                companyId: null,
                roleEntity: {
                    roleModules: [
                        makeRoleModule("tomo",    false, null),
                        makeRoleModule("empresa", false, null),
                    ],
                },
            });
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(user);

            const result = await service.login({ login: "joao@example.com", password: "123" });

            expect(result.user.companyScopes["tomo"]).toBeNull();
            expect(result.user.companyScopes["empresa"]).toBeNull();
        });
    });

    // refresh

    describe("refresh", () => {
        it("retorna novo access_token com modulos atualizados do DB", async () => {
            const dbUser = makeUser({
                roleEntity: { roleModules: [makeRoleModule("tomo", true)] },
            });
            (authRepo.findById as jest.Mock).mockResolvedValue(dbUser);

            const result = await service.refresh({ id: 1, email: "joao@example.com" });

            expect(result.access_token).toBe("signed-token");
            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ modules: ["tomo"] }),
            );
        });

        it("usa dados do DB para name/surname quando disponivel", async () => {
            const dbUser = makeUser({ name: "Joao Atualizado", surname: "Silva" });
            (authRepo.findById as jest.Mock).mockResolvedValue(dbUser);

            await service.refresh({ id: 1, email: "joao@example.com", name: "Nome Antigo" });

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ name: "Joao Atualizado" }),
            );
        });

        it("usa dados do parametro como fallback quando DB nao retorna user", async () => {
            (authRepo.findById as jest.Mock).mockResolvedValue(null);

            const result = await service.refresh({
                id: 1, email: "joao@example.com", name: "Fallback",
            });

            expect(result.access_token).toBe("signed-token");
            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ name: "Fallback" }),
            );
        });

        it("inclui jti fresco a cada refresh", async () => {
            (authRepo.findById as jest.Mock).mockResolvedValue(makeUser());

            await service.refresh({ id: 1, email: "joao@example.com" });
            await service.refresh({ id: 1, email: "joao@example.com" });

            const calls = jwtService.sign.mock.calls;
            expect(calls[0][0].jti).not.toBe(calls[1][0].jti);
        });
    });
});
