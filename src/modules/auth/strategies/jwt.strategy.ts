import { Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenBlocklistService } from "../services/token-blocklist.service";
import { SessaoService } from "../services/sessao.service";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";

interface JwtPayload {
    sub: number;
    email: string;
    name?: string;
    surname?: string | null;
    roleId?: number | null;
    modules?: string[];
    writeModules?: string[];
    companyScopes?: Record<string, number[] | null>;
    companyId?: number | null;
    jti?: string;
    sid?: string;
    csrf?: string;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly blocklist: TokenBlocklistService,
        private readonly sessoes: SessaoService,
    ) {
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
        if (payload.sid) {
            // Fonte da verdade: a sessao no banco (revogada, expirada ou inativa => 401).
            if (!(await this.sessoes.validar(payload.sid, payload.sub))) {
                throw new UnauthorizedException("Sessao invalida ou expirada");
            }
        } else {
            // Token legado (emitido antes das sessoes no banco): aceito ate expirar, salvo
            // SESSAO_EXIGIR_SID=true. Vale no maximo JWT_EXPIRES_IN apos o deploy.
            if (process.env.SESSAO_EXIGIR_SID === "true") {
                throw new UnauthorizedException("Sessao invalida ou expirada");
            }
            if (payload.jti && await this.blocklist.isRevoked(payload.jti)) {
                throw new UnauthorizedException("Token revogado");
            }
        }
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name ?? "",
            surname: payload.surname ?? null,
            roleId: payload.roleId ?? null,
            modules: payload.modules ?? [],
            writeModules: payload.writeModules ?? [],
            companyScopes: payload.companyScopes ?? {},
            companyId: payload.companyId ?? null,
            jti: payload.jti ?? null,
            sid: payload.sid ?? null,
            csrfToken: payload.csrf ?? null,
            exp: payload.exp ?? null,
        };
    }
}
