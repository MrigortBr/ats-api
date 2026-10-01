/**
 * Prepara valores para a trilha de auditoria: remove segredos, resume binarios
 * e limita o tamanho (importacoes em massa podem mandar milhares de linhas).
 */

const CHAVES_SENSIVEIS = /(senha|password|passwd|pass$|token|secret|segredo|authorization|cookie|api[-_]?key)/i;
const MAX_ITENS_ARRAY = 20;
const MAX_TEXTO = 2000;
const MAX_PROFUNDIDADE = 4;

export const OMITIDO = "[omitido]";

export function sanitizarValor(valor: unknown, profundidade = 0): unknown {
    if (valor === null || valor === undefined) return valor ?? null;
    if (typeof valor === "string") {
        return valor.length > MAX_TEXTO ? `${valor.slice(0, MAX_TEXTO)}… (+${valor.length - MAX_TEXTO} caracteres)` : valor;
    }
    if (typeof valor === "number" || typeof valor === "boolean") return valor;
    if (typeof valor === "bigint") return valor.toString();
    if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor.toISOString();
    if (Buffer.isBuffer(valor)) return `[binário ${valor.length} bytes]`;
    if (profundidade >= MAX_PROFUNDIDADE) return "[…]";

    if (Array.isArray(valor)) {
        const itens = valor.slice(0, MAX_ITENS_ARRAY).map((v) => sanitizarValor(v, profundidade + 1));
        if (valor.length > MAX_ITENS_ARRAY) itens.push(`… (+${valor.length - MAX_ITENS_ARRAY} itens, total ${valor.length})`);
        return itens;
    }
    if (typeof valor === "object") {
        const saida: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
            if (typeof v === "function") continue;
            saida[k] = CHAVES_SENSIVEIS.test(k) ? OMITIDO : sanitizarValor(v, profundidade + 1);
        }
        return saida;
    }
    return String(valor);
}

export function chaveSensivel(nome: string): boolean {
    return CHAVES_SENSIVEIS.test(nome);
}

/** Comparacao de valores ja sanitizados (para nao registrar "mudancas" iguais). */
export function iguais(a: unknown, b: unknown): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}
