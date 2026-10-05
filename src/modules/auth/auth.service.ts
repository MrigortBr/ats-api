import { v4 as uuidv4 } from "uuid";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import { InvalidCredentialsException } from "./exceptions/invalid.exception";
import { SessaoService } from "./services/sessao.service";
import * as payload from "./type/payload";
import type { RequestOrigin } from "../termo/request-origin";

/**
 * Constrói mapa module → companyIds (null = todas as empresas).
 *
 * Regras de escopo:
 *  - rm.companyId === null && userCompanyId === null → null (gestor_geral, irrestrito)
 *  - rm.companyId === null && userCompanyId !== null → [userCompanyId] (scoped à empresa do usuário)
 *  - rm.companyId !== null                          → override explícito, usa rm.companyId
 */
function buildCompanyScopes(
    roleModules: { module: string; companyId: number | null }[],
    userCompanyId: number | null,
): Record<string, number[] | null> {
    const scopes: Record<string, number[] | null> = {};
    for (const rm of roleModules) {
        if (rm.companyId === null) {
            if (userCompanyId === null) {
                scopes[rm.module] = null; // gestor_geral: irrestrito
            } else {
                // funcionario/gestor_empresa: escopo à empresa do usuário
                if (scopes[rm.module] !== null) {
                    scopes[rm.module] = [...(scopes[rm.module] ?? []), userCompanyId];
                }
                // se já é null (irrestrito), mantém null
            }
        } else {
            // override explícito por role_module
            if (scopes[rm.module] !== null) {
                scopes[rm.module] = [...(scopes[rm.module] ?? []), rm.companyId];
            }
        }
    }
    return scopes;
}

/**
 * Resolve o que o usuario pode acessar a partir da role + overrides individuais.
 * Usado igualmente por login() e refresh(), para os dois nunca divergirem.
 *
 *  - modules: modulos da role UNIDOS aos de modules_override (so leitura extra).
 *  - writeModules: so os modulos da role com canWrite (override nunca concede escrita).
 *  - companyScopes: ver buildCompanyScopes.
 */
function resolveAccess(
    roleModules: { module: string; canWrite: boolean; companyId: number | null }[],
    modulesOverride: string[] | null | undefined,
    companyId: number | null,
) {
    const modules = [...new Set([...roleModules.map((rm) => rm.module), ...(modulesOverride ?? [])])];
    const writeModules = roleModules.filter((rm) => rm.canWrite).map((rm) => rm.module);
    const companyScopes = buildCompanyScopes(roleModules, companyId);
    return { modules, writeModules, companyScopes };
}

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService,
        private readonly sessaoService: SessaoService,
    ) {}

    async login(data: payload.login) {
        const user = await this.authRepository.findByEmail(data.login);

        if (!user) throw new InvalidCredentialsException();

        const passwordMatch = await bcrypt.compare(data.password, user.password);
        if (!passwordMatch) throw new InvalidCredentialsException();

        const { modules, writeModules, companyScopes } = resolveAccess(
            user.roleEntity?.roleModules ?? [],
            user.modulesOverride,
            user.companyId ?? null,
        );

        const sessao = await this.sessaoService.criar(user.id);
        const jti = uuidv4();
        const token = this.jwtService.sign({
            jti,
            sid:          sessao.sid,
            csrf:         sessao.csrf,
            sub:          user.id,
            email:        user.email,
            name:         user.name,
            surname:      user.surname ?? null,
            /** RBAC */
            roleId:       user.roleId,
            modules,
            writeModules,
            companyScopes,
            companyId:    user.companyId,
        });

        return {
            access_token: token,
            refresh_token: sessao.refreshToken,
            sid: sessao.sid,
            csrfToken: sessao.csrf,
            user: {
                id:           user.id,
                name:         user.name,
                surname:      user.surname,
                email:        user.email,
                /** RBAC */
                roleId:       user.roleId,
                modules,
                writeModules,
                companyScopes,
                companyId:    user.companyId,
            },
        };
    }

    /**
     * Renova a sessao a partir do refresh token (cookie HttpOnly), mesmo com o JWT de acesso
     * ja expirado. Rotaciona o refresh token e re-le o usuario/permissoes do banco.
     */
    async refresh(refreshToken: string, origem: RequestOrigin) {
        const sessao = await this.sessaoService.rotacionar(refreshToken, origem);

        // Re-le o usuario para pegar modulos atualizados (ex: admin mudou permissoes).
        // companyId do banco (nao o do JWT antigo): se um admin trocou a empresa do usuario,
        // o escopo novo ja vale neste refresh, igual ao login.
        const dbUser = await this.authRepository.findById(sessao.userId);
        if (!dbUser) {
            await this.sessaoService.revogarPorToken(sessao.refreshToken, "usuario_removido");
            throw new UnauthorizedException("Sessao invalida ou expirada.");
        }
        const { modules, writeModules, companyScopes } = resolveAccess(
            dbUser.roleEntity?.roleModules ?? [],
            dbUser.modulesOverride,
            dbUser.companyId ?? null,
        );

        const token = this.jwtService.sign({
            jti:          uuidv4(),
            sid:          sessao.sid,
            csrf:         sessao.csrf,
            sub:          dbUser.id,
            email:        dbUser.email,
            name:         dbUser.name,
            surname:      dbUser.surname ?? null,
            roleId:       dbUser.roleId,
            modules,
            writeModules,
            companyScopes,
            companyId:    dbUser.companyId ?? null,
        });
        return { access_token: token, refresh_token: sessao.refreshToken, csrfToken: sessao.csrf };
    }

    /** Le o JWT de acesso sem lancar erro (expirado/invalido -> null). So para o logout de tokens legados. */
    lerTokenAcesso(token: string | undefined): { sub?: number; email?: string; jti?: string; sid?: string; exp?: number } | null {
        if (!token) return null;
        try {
            return this.jwtService.verify(token);
        } catch {
            return null;
        }
    }
}
