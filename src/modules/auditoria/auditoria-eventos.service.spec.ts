import { randomBytes } from "crypto";
import {
    AuditoriaEventosService,
    aadDoEvento,
    calcularHashEvento,
    type DetalhesEvento,
} from "./auditoria-eventos.service";
import { decifrar, sha256 } from "../termo/auditoria-cripto";
import type { AuditoriaEvento } from "./entities/auditoria-evento.entity";

const CHAVE_B64 = randomBytes(32).toString("base64");
const CHAVE = Buffer.from(CHAVE_B64, "base64");
const origem = { ip: "10.1.2.3", xForwardedFor: null, userAgent: "UA", acceptLanguage: "pt-BR" };

function makeRepos(ultimoHash: string | null = null, usuario: { id: number; email: string } | null = null) {
    const salvos: AuditoriaEvento[] = [];
    const tabela = {
        find:   jest.fn().mockResolvedValue(ultimoHash ? [{ id: "1", hash: ultimoHash }] : []),
        create: jest.fn((x) => x),
        save:   jest.fn(async (x) => { const s = { ...x, id: String(salvos.length + 2) }; salvos.push(s); return s; }),
    };
    const em = { query: jest.fn().mockResolvedValue([]), getRepository: jest.fn(() => tabela) };
    const repo = { manager: { transaction: jest.fn(async (cb) => cb(em)) } };
    const users = { findOne: jest.fn().mockResolvedValue(usuario) };
    return { repo, users, salvos, em };
}

describe("AuditoriaEventosService", () => {
    const envOriginal = { ...process.env };
    beforeEach(() => { process.env.AUDITORIA_CHAVE = CHAVE_B64; });
    afterAll(() => { process.env = envOriginal; });

    it("grava evento com detalhes cifrados, lock e hash encadeado", async () => {
        const { repo, users, salvos, em } = makeRepos("c".repeat(64));
        const svc = new AuditoriaEventosService(repo as never, users as never);

        await svc.registrar({
            tipo: "LOGOUT",
            usuario: { id: 3, email: "ana@saude.gov.br" },
            detalhes: { origem, sessaoJti: "jti-1" },
        });

        expect(em.query.mock.calls[0][0]).toContain("pg_advisory_xact_lock");
        const e = salvos[0];
        expect(e.tipo).toBe("LOGOUT");
        expect(e.userId).toBe(3);
        expect(e.hashAnterior).toBe("c".repeat(64));
        expect(JSON.stringify(e)).not.toContain("10.1.2.3");

        const { id: _id, hash, hashAnterior, ...campos } = e;
        expect(calcularHashEvento(campos, hashAnterior)).toBe(hash);

        const json = decifrar(e.detalhesCifrados, CHAVE, aadDoEvento(e));
        const detalhes = JSON.parse(json) as DetalhesEvento;
        expect(detalhes.origem.ip).toBe("10.1.2.3");
        expect(detalhes.sessaoJti).toBe("jti-1");
        expect(sha256(json)).toBe(e.detalhesHash);
    });

    it("falha de login identifica o usuario quando o e-mail existe", async () => {
        const { repo, users, salvos } = makeRepos(null, { id: 9, email: "joao@saude.gov.br" });
        await new AuditoriaEventosService(repo as never, users as never)
            .registrarFalhaLogin(" joao@saude.gov.br ", "credenciais_invalidas", origem);

        const e = salvos[0];
        expect(e.tipo).toBe("LOGIN_FALHA");
        expect(e.userId).toBe(9);
        const d = JSON.parse(decifrar(e.detalhesCifrados, CHAVE, aadDoEvento(e))) as DetalhesEvento;
        expect(d.emailInformado).toBe("joao@saude.gov.br");
        expect(d.motivo).toBe("credenciais_invalidas");
    });

    it("falha de login com e-mail inexistente fica sem usuario", async () => {
        const { repo, users, salvos } = makeRepos();
        await new AuditoriaEventosService(repo as never, users as never)
            .registrarFalhaLogin("ninguem@x.com", "credenciais_invalidas", origem);
        expect(salvos[0].userId).toBeNull();
        expect(salvos[0].userEmail).toBeNull();
    });

    it("registrarSemFalhar nao propaga erro do banco", async () => {
        const { users } = makeRepos();
        const repo = { manager: { transaction: jest.fn().mockRejectedValue(new Error("db fora")) } };
        const svc = new AuditoriaEventosService(repo as never, users as never);
        await expect(svc.registrarSemFalhar({ tipo: "LOGOUT", detalhes: { origem } })).resolves.toBeUndefined();
        await expect(svc.registrar({ tipo: "LOGOUT", detalhes: { origem } })).rejects.toThrow("db fora");
    });
});
