import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CompanyScopeGuard } from "./company-scope.guard";

// ─── helpers ──────────────────────────────────────────────────────────────────

interface UserStub {
    modules?: string[];
    companyId?: number | null;
    companyScopes?: Record<string, number[] | null>;
}

function makeContext(user: UserStub | undefined, params: Record<string, string> = {}): ExecutionContext {
    return {
        getHandler: () => ({}),
        getClass:   () => ({}),
        switchToHttp: () => ({
            getRequest: () => ({ user, params }),
        }),
    } as unknown as ExecutionContext;
}

function makeGuard(requiredModule: string | undefined): CompanyScopeGuard {
    const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(requiredModule),
    } as unknown as Reflector;
    return new CompanyScopeGuard(reflector);
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("CompanyScopeGuard", () => {

    describe("rota sem módulo requerido", () => {
        it("permite acesso quando não há módulo definido", () => {
            const guard = makeGuard(undefined);
            expect(guard.canActivate(makeContext({ modules: [] }))).toBe(true);
        });
    });

    describe("usuário admin (superusuário)", () => {
        it("permite acesso a qualquer empresa sem verificar escopo", () => {
            const guard = makeGuard("gestor");
            const user: UserStub = {
                modules: ["admin"],
                companyScopes: { gestor: [] }, // array vazio, mas admin ignora
            };
            expect(guard.canActivate(makeContext(user, { companyId: "99" }))).toBe(true);
        });
    });

    describe("gestor_geral (companyScopes[module] === null)", () => {
        it("permite acesso a qualquer empresa", () => {
            const guard = makeGuard("gestor");
            const user: UserStub = {
                modules: ["gestor"],
                companyScopes: { gestor: null },
            };
            expect(guard.canActivate(makeContext(user, { companyId: "5" }))).toBe(true);
        });
    });

    describe("módulo sem restrição de escopo no token", () => {
        it("permite acesso quando o módulo não está em companyScopes", () => {
            const guard = makeGuard("transporte");
            const user: UserStub = {
                modules: ["transporte"],
                companyScopes: {},
            };
            expect(guard.canActivate(makeContext(user, { companyId: "3" }))).toBe(true);
        });
    });

    describe("gestor com escopo restrito a empresas específicas", () => {
        it("permite acesso à empresa dentro do escopo", () => {
            const guard = makeGuard("gestor");
            const user: UserStub = {
                modules: ["gestor"],
                companyScopes: { gestor: [1, 2, 3] },
            };
            expect(guard.canActivate(makeContext(user, { companyId: "2" }))).toBe(true);
        });

        it("bloqueia acesso à empresa fora do escopo", () => {
            const guard = makeGuard("gestor");
            const user: UserStub = {
                modules: ["gestor"],
                companyScopes: { gestor: [1, 2] },
            };
            expect(() =>
                guard.canActivate(makeContext(user, { companyId: "5" })),
            ).toThrow(ForbiddenException);
        });

        it("bloqueia quando o scopo é array vazio (sem acesso a nenhuma empresa)", () => {
            const guard = makeGuard("gestor");
            const user: UserStub = {
                modules: ["gestor"],
                companyScopes: { gestor: [] },
            };
            expect(() =>
                guard.canActivate(makeContext(user, { companyId: "1" })),
            ).toThrow(ForbiddenException);
        });
    });

    describe("parâmetro companyId ausente ou inválido", () => {
        it("bloqueia quando o route param companyId não está presente", () => {
            const guard = makeGuard("gestor");
            const user: UserStub = {
                modules: ["gestor"],
                companyScopes: { gestor: [1] },
            };
            expect(() =>
                guard.canActivate(makeContext(user, {})), // sem params
            ).toThrow(ForbiddenException);
        });

        it("bloqueia quando companyId não é um número válido", () => {
            const guard = makeGuard("gestor");
            const user: UserStub = {
                modules: ["gestor"],
                companyScopes: { gestor: [1] },
            };
            expect(() =>
                guard.canActivate(makeContext(user, { companyId: "abc" })),
            ).toThrow(ForbiddenException);
        });
    });

    describe("usuário não autenticado", () => {
        it("bloqueia quando request.user é undefined", () => {
            const guard = makeGuard("gestor");
            expect(() =>
                guard.canActivate(makeContext(undefined, { companyId: "1" })),
            ).toThrow(ForbiddenException);
        });
    });
});
