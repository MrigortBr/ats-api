import type { Request } from "express";

/** Dados de origem lidos da propria requisicao HTTP (nao confiam no frontend). */
export interface RequestOrigin {
    ip: string | null;
    xForwardedFor: string | null;
    userAgent: string | null;
    acceptLanguage: string | null;
}

function header(req: Request, name: string, max: number): string | null {
    const raw = req.headers[name];
    const value = Array.isArray(raw) ? raw.join(", ") : raw;
    if (!value) return null;
    return value.slice(0, max);
}

/** Remove o prefixo IPv4-mapeado ("::ffff:10.0.0.1" -> "10.0.0.1"). */
export function normalizeIp(ip: string | undefined | null): string | null {
    if (!ip) return null;
    const clean = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
    return clean.slice(0, 45);
}

/**
 * Extrai IP, X-Forwarded-For, User-Agent e Accept-Language.
 *
 * `req.ip` so considera o X-Forwarded-For quando TRUST_PROXY esta configurado
 * (ver main.ts) — sem isso, um cliente poderia forjar o proprio IP pelo header.
 * O header bruto e guardado a parte, como referencia.
 */
export function extractRequestOrigin(req: Request): RequestOrigin {
    return {
        ip:             normalizeIp(req.ip ?? req.socket?.remoteAddress),
        xForwardedFor:  header(req, "x-forwarded-for", 1000),
        userAgent:      header(req, "user-agent", 1000),
        acceptLanguage: header(req, "accept-language", 255),
    };
}
