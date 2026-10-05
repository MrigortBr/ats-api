import { Body, ConflictException, Controller, ForbiddenException, Get, HttpException, Logger, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { TokenBlocklistService } from "./services/token-blocklist.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dto/create-user.dto";
import { TermoAceiteService } from "../termo/termo-aceite.service";
import { extractRequestOrigin } from "../termo/request-origin";
import { AuditoriaEventosService } from "../auditoria/auditoria-eventos.service";
import { SessaoService, absolutoMs } from "./services/sessao.service";

const COOKIE_NAME = "jwt";
const REFRESH_COOKIE_NAME = "ats_refresh";

/** Le o jti do JWT recem-emitido (sem validar — o token acabou de ser assinado aqui). */
function jtiDoToken(token: string): string | null {
    try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
        return typeof payload?.jti === "string" ? payload.jti : null;
    } catch {
        return null;
    }
}

/** Motivo da falha de login gravado na auditoria. */
function motivoFalha(err: unknown): string {
    if (err instanceof ConflictException) return "termo_versao_desatualizada";
    if (err instanceof HttpException && err.getStatus() === 401) return "credenciais_invalidas";
    return "erro_interno";
}
const COOKIE_MAX_AGE = 30 * 60 * 1000; // 30 min — deve casar com JWT_EXPIRES_IN

function baseCookie() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        // "none" e obrigatorio quando API e frontend estao em dominios diferentes (cross-site).
        // Requer secure=true em producao; em dev (localhost) usa "lax" para funcionar sem HTTPS.
        sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    };
}

function cookieOptions() {
    return { ...baseCookie(), maxAge: COOKIE_MAX_AGE };
}

/**
 * O refresh token so trafega para /auth/* (refresh e logout), reduzindo a exposicao do cookie
 * de vida mais longa. O Path e prefixo: precisa cobrir as DUAS rotas (se a API ficar atras de um
 * proxy com prefixo, ajuste REFRESH_COOKIE_PATH, ex.: "/api/auth").
 */
function refreshCookiePath(): string {
    return process.env.REFRESH_COOKIE_PATH?.trim() || "/auth";
}

function refreshCookieOptions() {
    return { ...baseCookie(), maxAge: absolutoMs(), path: refreshCookiePath() };
}

function lerRefreshCookie(req: Request): string | null {
    const v = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    return typeof v === "string" && v.length > 0 ? v : null;
}

@Controller("/auth")
export class AuthController {
    private readonly logger = new Logger("Csrf");

    constructor(
        private readonly authService: AuthService,
        private readonly sessaoService: SessaoService,
        private readonly blocklist: TokenBlocklistService,
        private readonly termoAceite: TermoAceiteService,
        private readonly auditoria: AuditoriaEventosService,
    ) {}

    /**
     * Login com aceite do Termo de Uso.
     *
     * Ordem: versao do termo -> credenciais -> grava assinatura -> emite cookie.
     * Se a assinatura nao puder ser gravada, o cookie NAO e emitido (sem aceite
     * registrado nao ha acesso aos dados). Sucesso e falha geram evento de auditoria.
     */
    @Post("/login")
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    async login(
        @Body() body: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const origem = extractRequestOrigin(req);

        let result: Awaited<ReturnType<AuthService["login"]>>;
        let termo: Awaited<ReturnType<TermoAceiteService["registrar"]>>;
        try {
            this.termoAceite.assertVersaoVigente(body.aceite.versao);
            result = await this.authService.login({ login: body.login, password: body.password });
            termo = await this.termoAceite.registrar(result.user, body.aceite, origem);
        } catch (err) {
            await this.auditoria.registrarFalhaLogin(body.login, motivoFalha(err), origem);
            throw err;
        }

        await this.auditoria.registrarSemFalhar({
            tipo: "LOGIN_SUCESSO",
            usuario: { id: result.user.id, email: result.user.email },
            termoAceiteId: termo.id,
            detalhes: { origem, sessaoJti: jtiDoToken(result.access_token), sessaoId: result.sid },
        });

        res.cookie(COOKIE_NAME, result.access_token, cookieOptions());
        res.cookie(REFRESH_COOKIE_NAME, result.refresh_token, refreshCookieOptions());
        return {
            user: result.user,
            termo: { versao: termo.versao, assinadoEm: termo.assinadoEm, registro: termo.id },
        };
    }

    /**
     * Renova a sessao pelo refresh token (cookie HttpOnly), mesmo com o JWT de acesso expirado.
     * Rotaciona o refresh token. Reuso de um token ja rotacionado derruba todas as sessoes.
     *
     * CSRF: o X-CSRF-Token, quando enviado, precisa bater com o da sessao (CSRF_ENFORCE=true
     * bloqueia). Ausente e tolerado: apos recarregar a pagina o front nao tem o token em memoria,
     * e o origin-check (Origin/Referer) ja barra requisicoes de outros sites.
     */
    @Post("/refresh")
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const token = lerRefreshCookie(req);
        if (!token) throw new UnauthorizedException("Sessao invalida ou expirada.");

        await this.conferirCsrfDaSessao(req, token);

        const result = await this.authService.refresh(token, extractRequestOrigin(req));
        res.cookie(COOKIE_NAME, result.access_token, cookieOptions());
        res.cookie(REFRESH_COOKIE_NAME, result.refresh_token, refreshCookieOptions());
        return { message: "Token renovado", csrfToken: result.csrfToken };
    }

    @Get("/me")
    @UseGuards(JwtAuthGuard)
    me(@Req() req: Request) {
        // req.user e populado pelo JwtStrategy.validate() — a sessao ja foi validada no banco la
        return req.user;
    }

    /**
     * Encerra a sessao no servidor. Funciona mesmo com o JWT de acesso expirado
     * (usa o refresh token) e nunca falha por sessao ja encerrada.
     */
    @Post("/logout")
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = lerRefreshCookie(req);
        let usuario: { id: number; email: string } | null = null;
        let sid: string | null = null;

        if (refreshToken) {
            const sessao = await this.sessaoService.buscarAtivaPorToken(refreshToken);
            if (sessao) {
                await this.conferirCsrfDaSessao(req, refreshToken, sessao);
                sid = sessao.id;
                usuario = await this.sessaoService.identificarUsuario(sessao.userId);
                await this.sessaoService.revogarPorToken(refreshToken, "logout");
            }
        }

        // Token de acesso legado (sem sid): continua revogado pelo blocklist ate expirar.
        const legado = this.authService.lerTokenAcesso((req.cookies as Record<string, string> | undefined)?.[COOKIE_NAME]);
        if (legado?.jti && legado.exp && !legado.sid) {
            const ttl = Math.max(0, legado.exp - Math.floor(Date.now() / 1000));
            if (ttl > 0) await this.blocklist.revoke(legado.jti, ttl);
        }
        if (!usuario && legado?.sub && legado.email) usuario = { id: legado.sub, email: legado.email };

        if (usuario) {
            await this.auditoria.registrarSemFalhar({
                tipo: "LOGOUT",
                usuario,
                detalhes: { origem: extractRequestOrigin(req), sessaoJti: legado?.jti ?? null, sessaoId: sid },
            });
        }

        const base = baseCookie();
        res.clearCookie(COOKIE_NAME, base);
        res.clearCookie(REFRESH_COOKIE_NAME, { ...base, path: refreshCookiePath() });
        return { message: "Logout realizado com sucesso" };
    }

    /** Compara o X-CSRF-Token (se enviado) com o da sessao do refresh token. */
    private async conferirCsrfDaSessao(req: Request, refreshToken: string, sessaoJa?: Awaited<ReturnType<SessaoService["buscarAtivaPorToken"]>>): Promise<void> {
        const enviado = req.headers["x-csrf-token"];
        if (typeof enviado !== "string" || !enviado) return; // ver nota no refresh()
        const sessao = sessaoJa ?? (await this.sessaoService.buscarAtivaPorToken(refreshToken));
        if (!sessao || this.sessaoService.csrfConfere(sessao, enviado)) return;
        if (process.env.CSRF_ENFORCE === "true") throw new ForbiddenException("Token CSRF invalido ou ausente");
        this.logger.warn(`[modo log] ${req.method} ${req.url} -> header X-CSRF-Token invalido para a sessao`);
    }
}
