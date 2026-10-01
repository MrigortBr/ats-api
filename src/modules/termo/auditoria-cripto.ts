import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Criptografia dos dados de acesso da trilha de auditoria (AES-256-GCM).
 *
 * Variaveis de ambiente:
 *   AUDITORIA_CHAVE     chave de 32 bytes em base64 (gere com: openssl rand -base64 32)
 *                       ou 64 caracteres hex. Obrigatoria.
 *   AUDITORIA_CHAVE_ID  identificador da chave gravado em cada registro (padrao "k1").
 *                       Ao trocar a chave, use um novo id e guarde a antiga com
 *                       seguranca — ela continua necessaria para ler registros antigos.
 *
 * Formato do texto cifrado (base64): iv(12 bytes) | tag(16 bytes) | dados.
 */

export const ALGORITMO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export interface ChaveAuditoria {
    id: string;
    chave: Buffer;
}

export function parseChave(raw: string | undefined): Buffer {
    const valor = raw?.trim();
    if (!valor) {
        throw new Error("AUDITORIA_CHAVE nao definida -- gere com `openssl rand -base64 32` e configure o .env");
    }
    const chave = /^[0-9a-fA-F]{64}$/.test(valor) ? Buffer.from(valor, "hex") : Buffer.from(valor, "base64");
    if (chave.length !== 32) {
        throw new Error("AUDITORIA_CHAVE invalida -- precisa ter 32 bytes (base64 de 44 caracteres ou 64 hex)");
    }
    return chave;
}

export function carregarChaveDoAmbiente(env: NodeJS.ProcessEnv = process.env): ChaveAuditoria {
    const id = (env.AUDITORIA_CHAVE_ID?.trim() || "k1").slice(0, 20);
    return { id, chave: parseChave(env.AUDITORIA_CHAVE) };
}

/** Chave atual (para cifrar) + todas as chaves conhecidas por id (para decifrar). */
export interface Chaveiro {
    atual: ChaveAuditoria;
    porId: Map<string, Buffer>;
}

/**
 * Carrega a chave atual e, opcionalmente, chaves anteriores (apos rotacao):
 *   AUDITORIA_CHAVES_ANTERIORES="k0:<base64>;k00:<base64>"
 */
export function carregarChaveiro(env: NodeJS.ProcessEnv = process.env): Chaveiro {
    const atual = carregarChaveDoAmbiente(env);
    const porId = new Map<string, Buffer>([[atual.id, atual.chave]]);
    for (const item of (env.AUDITORIA_CHAVES_ANTERIORES ?? "").split(";")) {
        const sep = item.indexOf(":");
        if (sep <= 0) continue;
        const id = item.slice(0, sep).trim();
        if (id && !porId.has(id)) porId.set(id, parseChave(item.slice(sep + 1)));
    }
    return { atual, porId };
}

/** Cifra um texto. `aad` amarra o conteudo ao registro (nao pode ser movido para outra linha). */
export function cifrar(texto: string, chave: Buffer, aad: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITMO, chave, iv, { authTagLength: TAG_BYTES });
    cipher.setAAD(Buffer.from(aad, "utf8"));
    const dados = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), dados]).toString("base64");
}

/** Decifra (uso em auditoria). Lanca erro se o conteudo, a chave ou o aad nao conferirem. */
export function decifrar(cifrado: string, chave: Buffer, aad: string): string {
    const buf = Buffer.from(cifrado, "base64");
    const iv = buf.subarray(0, IV_BYTES);
    const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const dados = buf.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGORITMO, chave, iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(dados), decipher.final()]).toString("utf8");
}

export function sha256(texto: string): string {
    return createHash("sha256").update(texto, "utf8").digest("hex");
}
