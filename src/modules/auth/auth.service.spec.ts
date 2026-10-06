import { UnauthorizedException } from "@nestjs/common";
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
import { SessaoService } from "./services/sessao.service";
import type { RequestOrigin } from "../termo/request-origin";

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

const ORIGEM: RequestOrigin = { ip: "127.0.0.1", xForwardedFor: null, userAgent: "jest", acceptLanguage: null };

function makeSessaoService(): jest.Mocked<SessaoService> {
    return {
        criar: jest.fn().mockResolvedValue({ refreshToken: "refresh-1", sid: "10", csrf: "csrf-1" }),
        rotacionar: jest.fn().mockResolvedValue({ refreshToken: "refresh-2", sid: "11", csrf: "csrf-2", userId: 1 }),
        revogarPorToken: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SessaoService>;
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("AuthService", () => {
    let authRepo:   AuthRepository;
    let jwtService: jest.Mocked<JwtService>;
    let sessaoService: jest.Mocked<SessaoService>;
    let service:    AuthService;

    beforeEach(() => {
        authRepo      = makeRepo();
        jwtService    = makeJwtService();
        sessaoService = makeSessaoService();
        service       = new AuthService(authRepo, jwtService, sessaoService);

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

    // sessao no login

    describe("login — sessao", () => {
        it("cria a sessao e assina o JWT com sid e csrf dela", async () => {
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(makeUser());

            const result = await service.login({ login: "joao@example.com", password: "ok" });

            expect(sessaoService.criar).toHaveBeenCalledWith(1);
            expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ sid: "10", csrf: "csrf-1" }));
            expect(result.refresh_token).toBe("refresh-1");
            expect(result.sid).toBe("10");
        });

        it("nao cria sessao quando a senha nao confere", async () => {
            (authRepo.findByEmail as jest.Mock).mockResolvedValue(makeUser());
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ login: "joao@example.com", password: "x" }))
                .rejects.toThrow(InvalidCredentialsException);
            expect(sessaoService.criar).not.toHaveBeenCalled();
        });
    });

    // refresh

    describe("refresh", () => {
        it("rotaciona a sessao e devolve novo access_token, refresh_token e csrf", async () => {
            (authRepo.findById as jest.Mock).mockResolvedValue(makeUser());

            const result = await service.refresh("refresh-1", ORIGEM);

            expect(sessaoService.rotacionar).toHaveBeenCalledWith("refresh-1", ORIGEM);
            expect(result).toEqual({ access_token: "signed-token", refresh_token: "refresh-2", csrfToken: "csrf-2" });
            expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ sid: "11", csrf: "csrf-2", sub: 1 }));
        });

        it("re-le modulos atualizados do DB", async () => {
            const dbUser = makeUser({
                roleEntity: { roleModules: [makeRoleModule("tomo", true)] },
            });
            (authRepo.findById as jest.Mock).mockResolvedValue(dbUser);

            await service.refresh("refresh-1", ORIGEM);

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ modules: ["tomo"] }),
            );
        });

        it("usa name/surname do DB", async () => {
            (authRepo.findById as jest.Mock).mockResolvedValue(makeUser({ name: "Joao Atualizado", surname: "Silva" }));

            await service.refresh("refresh-1", ORIGEM);

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ name: "Joao Atualizado" }),
            );
        });

        it("usuario removido: revoga a sessao recem-criada e lanca 401", async () => {
            (authRepo.findById as jest.Mock).mockResolvedValue(null);

            await expect(service.refresh("refresh-1", ORIGEM)).rejects.toThrow(UnauthorizedException);
            expect(sessaoService.revogarPorToken).toHaveBeenCalledWith("refresh-2", "usuario_removido");
            expect(jwtService.sign).not.toHaveBeenCalled();
        });

        it("recalcula o escopo com o companyId do DB", async () => {
            const dbUser = makeUser({
                companyId: 9,
                roleEntity: { roleModules: [makeRoleModule("empresa", true)] },
            });
            (authRepo.findById as jest.Mock).mockResolvedValue(dbUser);

            await service.refresh("refresh-1", ORIGEM);

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ companyId: 9, companyScopes: { empresa: [9] } }),
            );
        });

        it("modules_override entra em modules mas nunca em writeModules", async () => {
            const dbUser = makeUser({
                modulesOverride: ["combo"],
                roleEntity: { roleModules: [makeRoleModule("tomo", true)] },
            });
            (authRepo.findById as jest.Mock).mockResolvedValue(dbUser);

            await service.refresh("refresh-1", ORIGEM);

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ modules: ["tomo", "combo"], writeModules: ["tomo"] }),
            );
        });

        it("propaga o erro quando a rotacao falha (token invalido/reusado)", async () => {
            sessaoService.rotacionar.mockRejectedValue(new UnauthorizedException("Sessao invalida ou expirada."));

            await expect(service.refresh("lixo", ORIGEM)).rejects.toThrow(UnauthorizedException);
            expect(authRepo.findById).not.toHaveBeenCalled();
        });

        it("inclui jti fresco a cada refresh", async () => {
            (authRepo.findById as jest.Mock).mockResolvedValue(makeUser());

            await service.refresh("refresh-1", ORIGEM);
            await service.refresh("refresh-1", ORIGEM);

            const calls = jwtService.sign.mock.calls;
            expect(calls[0][0].jti).not.toBe(calls[1][0].jti);
        });
    });
});
