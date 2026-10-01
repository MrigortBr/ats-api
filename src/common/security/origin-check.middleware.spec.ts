import { criarVerificacaoDeOrigem, origensPermitidas } from "./origin-check.middleware";

function executar(method: string, headers: Record<string, string>) {
    const mw = criarVerificacaoDeOrigem(origensPermitidas("https://ats.exemplo.gov.br, http://localhost:3000/"));
    const res: any = { statusCode: 200, status(c: number) { this.statusCode = c; return this; }, json: jest.fn() };
    const next = jest.fn();
    mw({ method, headers } as any, res, next);
    return { passou: next.mock.calls.length === 1, status: res.statusCode };
}

describe("verificação de origem (anti-CSRF)", () => {
    it("deixa passar GET de qualquer origem", () => {
        expect(executar("GET", { origin: "https://malicioso.com" }).passou).toBe(true);
    });
    it("aceita POST da origem permitida (com barra final normalizada)", () => {
        expect(executar("POST", { origin: "https://ats.exemplo.gov.br" }).passou).toBe(true);
        expect(executar("DELETE", { origin: "http://localhost:3000" }).passou).toBe(true);
    });
    it("recusa POST de outra origem", () => {
        expect(executar("POST", { origin: "https://malicioso.com" })).toEqual({ passou: false, status: 403 });
    });
    it("recusa Origin null", () => {
        expect(executar("PUT", { origin: "null" }).passou).toBe(false);
    });
    it("usa o Referer quando não há Origin", () => {
        expect(executar("PATCH", { referer: "https://ats.exemplo.gov.br/modulos" }).passou).toBe(true);
        expect(executar("PATCH", { referer: "https://malicioso.com/x" }).passou).toBe(false);
    });
    it("deixa passar chamadas sem Origin e sem Referer (servidor-a-servidor)", () => {
        expect(executar("POST", {}).passou).toBe(true);
    });
});
