import { ForbiddenException } from "@nestjs/common";
import { timingSafeEqual } from "crypto";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export interface CsrfRequestLike {
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    user?: unknown;
}

export interface CsrfOptions {
    /** true = responde 403; false = apenas chama onViolation (modo log). */
    enforce: boolean;
    onViolation: (message: string) => void;
}

function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Valida o token CSRF (header X-CSRF-Token) contra o claim `csrf` do JWT
 * (exposto em req.user.csrfToken pelo JwtStrategy).
 *
 * - So vale para metodos que alteram dados.
 * - Requisicoes autenticadas por header "Authorization: Bearer" nao usam cookie
 *   e portanto nao sao alvo de CSRF: ficam isentas.
 */
export function checkCsrf(req: CsrfRequestLike, opts: CsrfOptions): void {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) return;

    const auth = req.headers["authorization"];
    if (typeof auth === "string" && auth.startsWith("Bearer ")) return;

    const expected = (req.user as { csrfToken?: string | null } | undefined)?.csrfToken ?? null;
    const sent = req.headers["x-csrf-token"];

    if (expected && typeof sent === "string" && safeEqual(sent, expected)) return;

    const reason = !expected ? "sessao sem claim csrf" : "header X-CSRF-Token ausente ou invalido";
    if (opts.enforce) throw new ForbiddenException("Token CSRF invalido ou ausente");
    opts.onViolation(`${req.method} ${req.url} -> ${reason}`);
}
