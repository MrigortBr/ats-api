import { ModuleGuard } from "./module.guard";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

function makeContext(modules: string[]): ExecutionContext {
    return {
        getHandler: () => ({}),
        getClass:   () => ({}),
        switchToHttp: () => ({
            getRequest: () => ({ user: { modules } }),
        }),
    } as unknown as ExecutionContext;
}

describe("ModuleGuard", () => {
    let guard: ModuleGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new ModuleGuard(reflector);
    });

    it("permite quando nenhum módulo é requerido (rota pública)", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
        expect(guard.canActivate(makeContext([]))).toBe(true);
    });

    it("permite quando o usuário tem o módulo requerido", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue("transporte");
        expect(guard.canActivate(makeContext(["transporte", "tomo"]))).toBe(true);
    });

    it("lança ForbiddenException quando módulo não está nos módulos do usuário", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue("admin");
        expect(() => guard.canActivate(makeContext(["transporte"]))).toThrow(ForbiddenException);
    });

    it("lança ForbiddenException quando usuário não tem nenhum módulo", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue("tomo");
        expect(() => guard.canActivate(makeContext([]))).toThrow(ForbiddenException);
    });

    it("a mensagem do erro identifica o módulo negado", () => {
        jest.spyOn(reflector, "getAllAndOverride").mockReturnValue("combo");
        try {
            guard.canActivate(makeContext(["transporte"]));
            fail("deveria ter lançado exceção");
        } catch (e) {
            expect(e).toBeInstanceOf(ForbiddenException);
            expect((e as ForbiddenException).message).toContain("combo");
        }
    });
});
