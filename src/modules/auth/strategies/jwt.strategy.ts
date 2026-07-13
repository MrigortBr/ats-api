import { Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenBlocklistService } from "../services/token-blocklist.service";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";

interface JwtPayload {
    sub: number;
    email: string;
    role?: string;
    roleId?: number | null;
    modules?: string[];
    writeModules?: string[];
    companyScopes?: Record<string, number[] | null>;
    companyId?: number | null;
    jti?: string;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly blocklist: TokenBlocklistService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) =>
                    (req?.cookies as Record<string, string> | undefined)?.["jwt"] ?? null,
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: (() => {
                const s = process.env.JWT_SECRET;
                if (!s) throw new Error("JWT_SECRET nao definida -- configure o .env antes de iniciar a API");
                return s;
            })(),
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
            role: payload.role ?? null,
            roleId: payload.roleId ?? null,
            modules: payload.modules ?? [],
            writeModules: payload.writeModules ?? [],
            companyScopes: payload.companyScopes ?? {},
            companyId: payload.companyId ?? null,
            jti: payload.jti ?? null,
            exp: payload.exp ?? null,
        };
    }
}
