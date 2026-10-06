import { ForbiddenException } from "@nestjs/common";
import { checkCsrf, CsrfRequestLike } from "./csrf";

function makeReq(over: Partial<CsrfRequestLike> = {}): CsrfRequestLike {
    return {
        method: "POST",
        url: "/hospital/1",
        headers: { "x-csrf-token": "abc" },
        user: { csrfToken: "abc" },
        ...over,
    };
}

describe("checkCsrf", () => {
    const enforce = { enforce: true, onViolation: jest.fn() };
    const logOnly = () => ({ enforce: false, onViolation: jest.fn() });

    it("ignora metodos que nao alteram dados", () => {
        expect(() => checkCsrf(makeReq({ method: "GET", headers: {} }), enforce)).not.toThrow();
    });

    it("aceita token igual ao claim", () => {
        expect(() => checkCsrf(makeReq(), enforce)).not.toThrow();
    });

    it("bloqueia header ausente quando enforce=true", () => {
        expect(() => checkCsrf(makeReq({ headers: {} }), enforce)).toThrow(ForbiddenException);
    });

    it("bloqueia header diferente do claim", () => {
        expect(() => checkCsrf(makeReq({ headers: { "x-csrf-token": "xyz" } }), enforce)).toThrow(ForbiddenException);
    });

    it("bloqueia sessao sem claim csrf (JWT antigo)", () => {
        expect(() => checkCsrf(makeReq({ user: { csrfToken: null } }), enforce)).toThrow(ForbiddenException);
    });

    it("em modo log nao bloqueia, apenas registra", () => {
        const opts = logOnly();
        expect(() => checkCsrf(makeReq({ headers: {} }), opts)).not.toThrow();
        expect(opts.onViolation).toHaveBeenCalledTimes(1);
    });

    it("isenta requisicao autenticada por Bearer", () => {
        const req = makeReq({ headers: { authorization: "Bearer xxx" }, user: { csrfToken: null } });
        expect(() => checkCsrf(req, enforce)).not.toThrow();
    });
});
