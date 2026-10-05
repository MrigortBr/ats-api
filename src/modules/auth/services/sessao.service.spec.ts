import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { SessaoService, calcularExpiracao, sha256Hex } from "./sessao.service";
import type { Sessao } from "../entities/sessao.entity";
import type { RequestOrigin } from "../../termo/request-origin";

const ORIGEM: RequestOrigin = { ip: "127.0.0.1", xForwardedFor: null, userAgent: "jest", acceptLanguage: null };
const MIN = 60_000;

function sessao(p: Partial<Sessao> = {}): Sessao {
    const agora = Date.now();
    return {
        id: "7",
        userId: 1,
        tokenHash: sha256Hex("tok"),
        csrfHash: sha256Hex("csrf"),
        sessionStartedAt: new Date(agora - 10 * MIN),
        lastUsedAt: new Date(agora - 5 * MIN),
        expiresAt: new Date(agora + 60 * MIN),
        revokedAt: null,
        revokedReason: null,
        createdAt: new Date(agora - 10 * MIN),
        ...p,
    } as Sessao;
}

/** Monta o servico com repositorios simulados. `rotacao` = linha devolvida pelo UPDATE ... RETURNING. */
function montar(opts: { rotacao?: Array<Record<string, unknown>>; existente?: Sessao | null; porId?: Sessao | null } = {}) {
    const execute = jest.fn().mockResolvedValue({ raw: opts.rotacao ?? [] });
    const qb: Record<string, jest.Mock> = {};
    for (const m of ["update", "set", "where", "returning", "delete", "from"]) qb[m] = jest.fn().mockReturnValue(qb);
    qb.execute = execute;

    const sessoes = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
        create: jest.fn((x) => x),
        save: jest.fn().mockImplementation(async (x) => ({ ...x, id: "99" })),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockImplementation(async (q: { where: Record<string, unknown> }) =>
            "tokenHash" in q.where ? (opts.existente ?? null) : (opts.porId ?? null)),
    };
    const users = { findOne: jest.fn().mockResolvedValue({ id: 1, email: "a@b.com" }) };
    const auditoria = { registrarSemFalhar: jest.fn().mockResolvedValue(undefined) };
    const service = new SessaoService(sessoes as never, users as never, auditoria as never);
    return { service, sessoes, auditoria, qb };
}

describe("SessaoService", () => {
    describe("criar", () => {
        it("grava so o hash do refresh token e do csrf, nunca o valor bruto", async () => {
            const { service, sessoes } = montar();

            const r = await service.criar(1);

            const salvo = sessoes.save.mock.calls[0][0];
            expect(salvo.tokenHash).toBe(sha256Hex(r.refreshToken));
            expect(salvo.csrfHash).toBe(sha256Hex(r.csrf));
            expect(JSON.stringify(salvo)).not.toContain(r.refreshToken);
            expect(r.sid).toBe("99");
        });

        it("propaga o inicio da cadeia no refresh (teto absoluto)", async () => {
            const { service, sessoes } = montar();
            const inicio = new Date(Date.now() - 3 * 60 * MIN);

            await service.criar(1, inicio);

            expect(sessoes.save.mock.calls[0][0].sessionStartedAt).toBe(inicio);
        });
    });

    describe("calcularExpiracao", () => {
        it("usa a inatividade quando o teto absoluto esta longe", () => {
            const agora = new Date();
            expect(calcularExpiracao(agora, agora).getTime()).toBe(agora.getTime() + 120 * MIN);
        });

        it("nunca passa do teto absoluto", () => {
            const agora = new Date();
            const inicio = new Date(agora.getTime() - 23 * 60 * MIN - 30 * MIN); // 23h30 atras
            expect(calcularExpiracao(inicio, agora).getTime()).toBe(inicio.getTime() + 24 * 60 * MIN);
        });
    });

    describe("validar (sid do access token)", () => {
        it("sessao ativa: true", async () => {
            const { service } = montar({ porId: sessao() });
            await expect(service.validar("7", 1)).resolves.toBe(true);
        });

        it("sessao inexistente ou revogada (nao encontrada): false", async () => {
            const { service } = montar({ porId: null });
            await expect(service.validar("7", 1)).resolves.toBe(false);
        });

        it("sessao expirada por inatividade: false", async () => {
            const { service } = montar({ porId: sessao({ expiresAt: new Date(Date.now() - MIN) }) });
            await expect(service.validar("7", 1)).resolves.toBe(false);
        });

        it("passou do teto absoluto: false", async () => {
            const { service } = montar({ porId: sessao({ sessionStartedAt: new Date(Date.now() - 25 * 60 * MIN) }) });
            await expect(service.validar("7", 1)).resolves.toBe(false);
        });

        it("atualiza last_used_at no maximo a cada 60 s", async () => {
            const recente = montar({ porId: sessao({ lastUsedAt: new Date(Date.now() - 10_000) }) });
            await recente.service.validar("7", 1);
            expect(recente.sessoes.update).not.toHaveBeenCalled();

            const antigo = montar({ porId: sessao({ lastUsedAt: new Date(Date.now() - 5 * MIN) }) });
            await antigo.service.validar("7", 1);
            expect(antigo.sessoes.update).toHaveBeenCalledTimes(1);
        });
    });

    describe("csrfConfere", () => {
        it("aceita o token da sessao e rejeita outro ou ausente", () => {
            const { service } = montar();
            const s = sessao();
            expect(service.csrfConfere(s, "csrf")).toBe(true);
            expect(service.csrfConfere(s, "outro")).toBe(false);
            expect(service.csrfConfere(s, undefined)).toBe(false);
        });
    });

    describe("rotacionar", () => {
        const linhaOk = () => ({
            id: "7", user_id: 1,
            session_started_at: new Date(Date.now() - 10 * MIN),
            expires_at: new Date(Date.now() + 60 * MIN),
        });

        it("token ativo: revoga o antigo, cria o proximo elo e devolve o userId", async () => {
            const { service, sessoes } = montar({ rotacao: [linhaOk()] });

            const r = await service.rotacionar("tok", ORIGEM);

            expect(r.userId).toBe(1);
            expect(r.sid).toBe("99");
            expect(sessoes.save).toHaveBeenCalledTimes(1);
        });

        it("token inexistente: 401 sem derrubar ninguem", async () => {
            const { service, sessoes, auditoria } = montar({ rotacao: [], existente: null });

            await expect(service.rotacionar("lixo", ORIGEM)).rejects.toThrow(UnauthorizedException);
            expect(sessoes.update).not.toHaveBeenCalled();
            expect(auditoria.registrarSemFalhar).not.toHaveBeenCalled();
        });

        it("reuso de token rotacionado ha mais de 10 s: derruba todas as sessoes e audita", async () => {
            const existente = sessao({ revokedAt: new Date(Date.now() - 60_000), revokedReason: "rotacionada" });
            const { service, sessoes, auditoria } = montar({ rotacao: [], existente });

            await expect(service.rotacionar("tok", ORIGEM)).rejects.toThrow(UnauthorizedException);

            expect(sessoes.update).toHaveBeenCalledWith(
                { userId: 1, revokedAt: expect.anything() },
                expect.objectContaining({ revokedReason: "reuso" }),
            );
            expect(auditoria.registrarSemFalhar).toHaveBeenCalledWith(
                expect.objectContaining({ tipo: "SESSAO_REUSO", usuario: { id: 1, email: "a@b.com" } }),
            );
        });

        it("reuso dentro de 10 s (corrida entre abas): 409, sem derrubar sessoes", async () => {
            const existente = sessao({ revokedAt: new Date(Date.now() - 2_000), revokedReason: "rotacionada" });
            const { service, sessoes, auditoria } = montar({ rotacao: [], existente });

            await expect(service.rotacionar("tok", ORIGEM)).rejects.toThrow(ConflictException);
            expect(sessoes.update).not.toHaveBeenCalled();
            expect(auditoria.registrarSemFalhar).not.toHaveBeenCalled();
        });

        it("token revogado por logout: 401 sem alarme de reuso", async () => {
            const existente = sessao({ revokedAt: new Date(Date.now() - 60_000), revokedReason: "logout" });
            const { service, sessoes, auditoria } = montar({ rotacao: [], existente });

            await expect(service.rotacionar("tok", ORIGEM)).rejects.toThrow(UnauthorizedException);
            expect(sessoes.update).not.toHaveBeenCalled();
            expect(auditoria.registrarSemFalhar).not.toHaveBeenCalled();
        });

        it("sessao ja expirada por inatividade: 401 e nao cria o proximo elo", async () => {
            const linha = { ...linhaOk(), expires_at: new Date(Date.now() - MIN) };
            const { service, sessoes } = montar({ rotacao: [linha] });

            await expect(service.rotacionar("tok", ORIGEM)).rejects.toThrow(UnauthorizedException);
            expect(sessoes.save).not.toHaveBeenCalled();
        });

        it("passou do teto absoluto: 401", async () => {
            const linha = { ...linhaOk(), session_started_at: new Date(Date.now() - 25 * 60 * MIN) };
            const { service, sessoes } = montar({ rotacao: [linha] });

            await expect(service.rotacionar("tok", ORIGEM)).rejects.toThrow(UnauthorizedException);
            expect(sessoes.save).not.toHaveBeenCalled();
        });
    });

    describe("revogacao", () => {
        it("logout revoga pelo hash do token", async () => {
            const { service, sessoes } = montar();
            await service.revogarPorToken("tok", "logout");
            expect(sessoes.update).toHaveBeenCalledWith(
                { tokenHash: sha256Hex("tok"), revokedAt: expect.anything() },
                expect.objectContaining({ revokedReason: "logout" }),
            );
        });

        it("revogarTodasDoUsuario atinge so as sessoes ativas do usuario", async () => {
            const { service, sessoes } = montar();
            await service.revogarTodasDoUsuario(5, "senha_alterada");
            expect(sessoes.update).toHaveBeenCalledWith(
                { userId: 5, revokedAt: expect.anything() },
                expect.objectContaining({ revokedReason: "senha_alterada" }),
            );
        });
    });
});
