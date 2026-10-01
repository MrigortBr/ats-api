import { Body, ConflictException, Controller, Get, HttpException, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { TokenBlocklistService } from "./services/token-blocklist.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dto/create-user.dto";
import { TermoAceiteService } from "../termo/termo-aceite.service";
import { extractRequestOrigin } from "../termo/request-origin";
import { AuditoriaEventosService } from "../auditoria/auditoria-eventos.service";
import { SkipCsrf } from "./decorators/skip-csrf.decorator";

const COOKIE_NAME = "jwt";

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

function cookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProd,
        // "none" e obrigatorio quando API e frontend estao em dominios diferentes (cross-site).
        // Requer secure=true em producao; em dev (localhost) usa "lax" para funcionar sem HTTPS.
        sameSite: (isProd ? "none" : "lax") as "none" | "lax",
        maxAge: COOKIE_MAX_AGE,
    };
}
@Controller("/auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
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
            detalhes: { origem, sessaoJti: jtiDoToken(result.access_token) },
        });

        res.cookie(COOKIE_NAME, result.access_token, cookieOptions());
        return {
            user: result.user,
            termo: { versao: termo.versao, assinadoEm: termo.assinadoEm, registro: termo.id },
        };
    }

    @Post("/refresh")
    // Isento: no 1o carregamento da pagina o front ainda nao tem o token CSRF.
    @SkipCsrf()
    @UseGuards(JwtAuthGuard)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.refresh(
            req.user as { id: number; email: string; name?: string; surname?: string | null; role?: string | null; roleId?: number | null; modules?: string[]; companyId?: number | null },
        );
        res.cookie(COOKIE_NAME, result.access_token, cookieOptions());
        return { message: "Token renovado", csrfToken: result.csrfToken };
    }

    @Get("/me")
    @UseGuards(JwtAuthGuard)
    me(@Req() req: Request) {
        // req.user e populado pelo JwtStrategy.validate() — sem acesso ao DB
        return req.user;
    }

    @Post("/logout")
    @UseGuards(JwtAuthGuard)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = req.user as { id?: number; email?: string; jti?: string | null; exp?: number | null } | undefined;
        if (user?.jti && user?.exp) {
            const ttl = Math.max(0, user.exp - Math.floor(Date.now() / 1000));
            if (ttl > 0) await this.blocklist.revoke(user.jti, ttl);
        }
        await this.auditoria.registrarSemFalhar({
            tipo: "LOGOUT",
            usuario: user?.id && user.email ? { id: user.id, email: user.email } : null,
            detalhes: { origem: extractRequestOrigin(req), sessaoJti: user?.jti ?? null },
        });
        const isProd = process.env.NODE_ENV === "production";
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
        });
        return { message: "Logout realizado com sucesso" };
    }
}
