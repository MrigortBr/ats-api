import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { TokenBlocklistService } from "./services/token-blocklist.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dto/create-user.dto";
import * as payload from "./type/payload";

const COOKIE_NAME = "jwt";
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
    ) {}

    @Post("/login")
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    async login(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(body as unknown as payload.login);
        res.cookie(COOKIE_NAME, result.access_token, cookieOptions());
        return { user: result.user };
    }

    @Post("/refresh")
    @UseGuards(JwtAuthGuard)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.refresh(
            req.user as { id: number; email: string; name?: string; surname?: string | null; role?: string | null; roleId?: number | null; modules?: string[]; companyId?: number | null },
        );
        res.cookie(COOKIE_NAME, result.access_token, cookieOptions());
        return { message: "Token renovado" };
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
        const user = req.user as { jti?: string | null; exp?: number | null } | undefined;
        if (user?.jti && user?.exp) {
            const ttl = Math.max(0, user.exp - Math.floor(Date.now() / 1000));
            if (ttl > 0) await this.blocklist.revoke(user.jti, ttl);
        }
        const isProd = process.env.NODE_ENV === "production";
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
        });
        return { message: "Logout realizado com sucesso" };
    }
}