import type { NextFunction, Request, Response } from "express";

/**
 * Proteção contra CSRF para a autenticação por cookie.
 *
 * O cookie de sessão é SameSite=None (front e API em domínios diferentes), então o
 * navegador o envia mesmo quando a requisição parte de um site malicioso. O CORS
 * impede que esse site LEIA a resposta, mas não impede que um <form> ou fetch
 * "simples" EXECUTE a ação (criar, alterar, excluir).
 *
 * Aqui toda requisição que altera dados (POST/PUT/PATCH/DELETE) vinda de navegador
 * precisa ter Origin (ou, na falta dele, Referer) igual a uma das origens permitidas
 * em CORS_ORIGIN. Navegadores sempre enviam Origin nessas requisições entre sites e
 * o site atacante não consegue forjá-lo.
 *
 * Requisições sem Origin e sem Referer (curl, integrações servidor-a-servidor,
 * Swagger local) continuam passando — não carregam o cookie da vítima.
 */
const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

export function origensPermitidas(valor: string | undefined): string[] {
    return (valor ?? "http://localhost:3000")
        .split(",")
        .map((o) => normalizarOrigem(o.trim()))
        .filter((o): o is string => !!o);
}

function normalizarOrigem(valor: string | undefined): string | null {
    if (!valor || valor === "null") return null;
    try {
        return new URL(valor).origin;
    } catch {
        return null;
    }
}

export function criarVerificacaoDeOrigem(permitidas: string[]) {
    const lista = new Set(permitidas);
    return (req: Request, res: Response, next: NextFunction) => {
        if (METODOS_SEGUROS.has(req.method.toUpperCase())) return next();

        const origin = req.headers.origin;
        const referer = req.headers.referer;
        if (origin === undefined && referer === undefined) return next();

        // "Origin: null" (iframe sandbox, file://, redirecionamentos) é sempre recusado.
        const origem = origin !== undefined ? normalizarOrigem(origin) : normalizarOrigem(referer);
        if (origem && lista.has(origem)) return next();

        res.status(403).json({ statusCode: 403, message: "Origem da requisição não permitida." });
    };
}
