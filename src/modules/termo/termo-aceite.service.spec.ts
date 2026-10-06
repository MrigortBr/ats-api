import { ConflictException } from "@nestjs/common";
import { randomBytes } from "crypto";
import type { Request } from "express";
import {
    TermoAceiteService,
    aadDoRegistro,
    calcularHashRegistro,
    toIsoWithOffset,
    type CamposHash,
    type DadosAcesso,
} from "./termo-aceite.service";
import { carregarChaveDoAmbiente, cifrar, decifrar, parseChave, sha256 } from "./auditoria-cripto";
import { extractRequestOrigin, normalizeIp } from "./request-origin";
import { TERMO_HASH, TERMO_VERSAO } from "./termo.constants";
import type { AceiteTermoDto } from "./dto/aceite-termo.dto";
import type { TermoAceite } from "./entities/termo-aceite.entity";

const CHAVE_B64 = randomBytes(32).toString("base64");
const CHAVE = Buffer.from(CHAVE_B64, "base64");

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeAceite(partial: Partial<AceiteTermoDto> = {}): AceiteTermoDto {
    return {
        versao:     TERMO_VERSAO,
        assinadoEm: "2026-10-01T08:51:37.214-03:00",
        cliente: {
            navegador: "Chrome", navegadorVersao: "129.0", sistemaOperacional: "Windows 10/11",
            tipoDispositivo: "desktop", idioma: "pt-BR", idiomas: ["pt-BR"],
            fusoHorario: "America/Sao_Paulo", offsetMinutos: -180, resolucaoTela: "1920x1080", pixelRatio: 1,
        },
        localizacao: { status: "concedida", latitude: -15.79, longitude: -47.88, precisaoMetros: 20 },
        ...partial,
    } as AceiteTermoDto;
}

const usuario = { id: 7, name: "Maria", surname: "Souza", email: "maria@saude.gov.br" };
const origem  = { ip: "200.1.2.3", xForwardedFor: "200.1.2.3", userAgent: "Mozilla/5.0", acceptLanguage: "pt-BR" };

/** Repositorio falso que simula a transacao, o advisory lock e a tabela. */
function makeRepo(ultimoHash: string | null = null) {
    const salvos: TermoAceite[] = [];
    const queries: string[] = [];
    const innerRepo = {
        find:   jest.fn().mockResolvedValue(ultimoHash ? [{ id: "1", hash: ultimoHash }] : []),
        create: jest.fn((x) => x),
        save:   jest.fn(async (x) => { const s = { ...x, id: String(salvos.length + 2) }; salvos.push(s); return s; }),
    };
    const em = {
        query:         jest.fn(async (q: string) => { queries.push(q); return []; }),
        getRepository: jest.fn(() => innerRepo),
    };
    const repo = { manager: { transaction: jest.fn(async (cb) => cb(em)) } };
    return { repo, salvos, queries };
}

function novoService(repo: unknown) {
    return new TermoAceiteService(repo as never);
}

function abrir(s: TermoAceite): DadosAcesso {
    return JSON.parse(decifrar(s.dadosAcessoCifrados, CHAVE, aadDoRegistro(s)));
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("TermoAceiteService", () => {
    const envOriginal = { ...process.env };
    beforeEach(() => {
        process.env.AUDITORIA_CHAVE = CHAVE_B64;
        process.env.AUDITORIA_CHAVE_ID = "k-test";
    });
    afterAll(() => { process.env = envOriginal; });

    it("nao inicializa sem AUDITORIA_CHAVE", () => {
        delete process.env.AUDITORIA_CHAVE;
        expect(() => novoService(makeRepo().repo)).toThrow(/AUDITORIA_CHAVE/);
    });

    it("recusa versao diferente da vigente com 409", () => {
        const service = novoService(makeRepo().repo);
        expect(() => service.assertVersaoVigente("0.9")).toThrow(ConflictException);
        expect(() => service.assertVersaoVigente(TERMO_VERSAO)).not.toThrow();
    });

    it("grava identificacao e horarios em claro e os dados de acesso cifrados", async () => {
        const { repo, salvos, queries } = makeRepo();
        const antes = Date.now();
        const r = await novoService(repo).registrar(usuario, makeAceite(), origem);

        expect(queries[0]).toContain("pg_advisory_xact_lock");
        expect(salvos).toHaveLength(1);
        const s = salvos[0];

        expect(s.userId).toBe(7);
        expect(s.userNome).toBe("Maria Souza");
        expect(s.termoVersao).toBe(TERMO_VERSAO);
        expect(s.termoHash).toBe(TERMO_HASH);
        expect(s.assinadoEmClienteTexto).toBe("2026-10-01T08:51:37.214-03:00");
        expect(s.assinadoEmCliente.toISOString()).toBe("2026-10-01T11:51:37.214Z");
        expect(s.assinadoEmServidor.getTime()).toBeGreaterThanOrEqual(antes);
        expect(s.criptoAlgoritmo).toBe("aes-256-gcm");
        expect(s.criptoChaveId).toBe("k-test");
        expect(s.hashAnterior).toBeNull();
        expect(s.hash).toMatch(/^[0-9a-f]{64}$/);
        expect(r.assinadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}-03:00$/);

        // Nada sensivel em claro no registro gravado
        const gravado = JSON.stringify(s);
        for (const segredo of ["200.1.2.3", "Mozilla", "Chrome", "-15.79", "1920x1080"]) {
            expect(gravado).not.toContain(segredo);
        }

        // Decifrando com a chave, o conteudo confere com o hash
        const dados = abrir(s);
        expect(dados.origem.ip).toBe("200.1.2.3");
        expect(dados.cliente.navegador).toBe("Chrome");
        expect(dados.localizacao).toEqual({ status: "concedida", latitude: -15.79, longitude: -47.88, precisaoMetros: 20 });
        expect(sha256(JSON.stringify(dados))).toBe(s.dadosAcessoHash);
    });

    it("conteudo cifrado copiado para outro registro nao decifra (AAD)", async () => {
        const { repo, salvos } = makeRepo();
        await novoService(repo).registrar(usuario, makeAceite(), origem);
        const s = salvos[0];
        expect(() => decifrar(s.dadosAcessoCifrados, CHAVE, aadDoRegistro({ ...s, userId: 8 }))).toThrow();
    });

    it("encadeia ao hash do registro anterior", async () => {
        const anterior = "a".repeat(64);
        const { repo, salvos } = makeRepo(anterior);
        await novoService(repo).registrar(usuario, makeAceite(), origem);
        expect(salvos[0].hashAnterior).toBe(anterior);
    });

    it("descarta coordenadas quando a localizacao nao foi concedida", async () => {
        const { repo, salvos } = makeRepo();
        await novoService(repo).registrar(
            usuario,
            makeAceite({ localizacao: { status: "negada", latitude: 1, longitude: 1 } }),
            origem,
        );
        expect(abrir(salvos[0]).localizacao).toEqual({ status: "negada", latitude: null, longitude: null, precisaoMetros: null });
    });
});

describe("auditoria-cripto", () => {
    it("aceita chave em base64 e em hex, recusa tamanho errado", () => {
        expect(parseChave(CHAVE_B64)).toEqual(CHAVE);
        expect(parseChave(CHAVE.toString("hex"))).toEqual(CHAVE);
        expect(() => parseChave("curta")).toThrow(/32 bytes/);
        expect(() => parseChave(undefined)).toThrow(/nao definida/);
    });

    it("usa k1 como id padrao", () => {
        expect(carregarChaveDoAmbiente({ AUDITORIA_CHAVE: CHAVE_B64 }).id).toBe("k1");
    });

    it("cifra com IV aleatorio e detecta adulteracao", () => {
        const a = cifrar("segredo", CHAVE, "aad");
        expect(cifrar("segredo", CHAVE, "aad")).not.toBe(a);
        expect(decifrar(a, CHAVE, "aad")).toBe("segredo");

        const buf = Buffer.from(a, "base64");
        buf[buf.length - 1] ^= 0xff;
        expect(() => decifrar(buf.toString("base64"), CHAVE, "aad")).toThrow();
        expect(() => decifrar(a, randomBytes(32), "aad")).toThrow();
    });
});

describe("calcularHashRegistro", () => {
    const base = {
        userId: 1, userNome: "A", userEmail: "a@a", termoVersao: "1.0", termoHash: "h", itens: ["x"],
        assinadoEmServidor: new Date("2026-10-01T11:00:00.000Z"), assinadoEmCliente: new Date("2026-10-01T11:00:00.000Z"),
        assinadoEmClienteTexto: "2026-10-01T08:00:00.000-03:00",
        dadosAcessoCifrados: "abc", dadosAcessoHash: "d", criptoAlgoritmo: "aes-256-gcm", criptoChaveId: "k1",
    } as CamposHash;

    it("e deterministico e muda com qualquer campo ou com o hash anterior", () => {
        const h = calcularHashRegistro(base, null);
        expect(calcularHashRegistro(base, null)).toBe(h);
        expect(calcularHashRegistro({ ...base, dadosAcessoCifrados: "abd" }, null)).not.toBe(h);
        expect(calcularHashRegistro(base, "b".repeat(64))).not.toBe(h);
    });
});

describe("toIsoWithOffset", () => {
    it("formata no fuso de Brasilia com milissegundos", () => {
        expect(toIsoWithOffset(new Date("2026-10-01T11:51:37.214Z"), "America/Sao_Paulo"))
            .toBe("2026-10-01T08:51:37.214-03:00");
    });
    it("usa +00:00 em UTC", () => {
        expect(toIsoWithOffset(new Date("2026-10-01T11:51:37.004Z"), "UTC"))
            .toBe("2026-10-01T11:51:37.004+00:00");
    });
});

describe("request-origin", () => {
    it("normaliza IPv4 mapeado em IPv6", () => {
        expect(normalizeIp("::ffff:10.0.0.5")).toBe("10.0.0.5");
        expect(normalizeIp("2804:14c::1")).toBe("2804:14c::1");
        expect(normalizeIp(undefined)).toBeNull();
    });

    it("extrai ip, x-forwarded-for, user-agent e accept-language", () => {
        const req = {
            ip: "::ffff:177.10.20.30",
            socket: { remoteAddress: "10.0.0.1" },
            headers: {
                "x-forwarded-for": "177.10.20.30, 10.0.0.1",
                "user-agent":      "Mozilla/5.0 (Windows NT 10.0)",
                "accept-language": "pt-BR,pt;q=0.9",
            },
        } as unknown as Request;
        expect(extractRequestOrigin(req)).toEqual({
            ip:             "177.10.20.30",
            xForwardedFor:  "177.10.20.30, 10.0.0.1",
            userAgent:      "Mozilla/5.0 (Windows NT 10.0)",
            acceptLanguage: "pt-BR,pt;q=0.9",
        });
    });
});
