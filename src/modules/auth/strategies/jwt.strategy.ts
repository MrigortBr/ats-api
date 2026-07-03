import { Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenBlocklistService } from "../services/token-blocklist.service";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";

interface JwtPayload {
    sub: number;
    email: string;
    /** Legado - mantido para tokens antigos enquanto nao expiram. */
    role?: string;
    /** RBAC dinamico */
    roleId?: number | null;
    modules?: string[];
    writeModules?: string[];
    companyId?: number | null;
    jti?: string;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly blocklist: TokenBlocklistService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                // 1a opcao: cookie HttpOnly - fluxo browser padrao
                (req: Request) =>
                    (req?.cookies as Record<string, string> | undefined)?.["jwt"] ?? null,
                // 2a opcao: Authorization: Bearer - compatibilidade com Swagger/CLI
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET ?? "default_secret",
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload?.sub || !payload?.email) {
            throw new UnauthorizedException("Token invalido");
        }
        if (payload.jti && await this.blocklist.isRevoked(payload.jti)) {
            throw new UnauthorizedException("Token revogado");
        }
        return {
            id: payload.sub,
            email: payload.email,
            /** Legado */
            role: payload.role ?? null,
            /** RBAC */
            roleId: payload.roleId ?? null,
            modules: payload.modules ?? [],
            writeModules: payload.writeModules ?? [],
            companyId: payload.companyId ?? null,
            jti: payload.jti ?? null,
            exp: payload.exp ?? null,
        };
    }
}
