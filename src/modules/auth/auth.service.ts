import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import { InvalidCredentialsException } from "./exceptions/invalid.exception";
import * as payload from "./type/payload";

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

        const jti = uuidv4();
        const token = this.jwtService.sign({
            jti,
            csrf:         randomBytes(32).toString("hex"),
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

    async refresh(user: {
        id: number;
        email: string;
        name?: string;
        surname?: string | null;
        roleId?: number | null;
        modules?: string[];
        companyId?: number | null;
    }) {
        // Re-lê o usuário para pegar módulos atualizados (ex: admin mudou permissões)
        const dbUser = await this.authRepository.findById(user.id);
        // companyId do banco (nao o do JWT antigo): se um admin trocou a empresa do usuario,
        // o escopo novo ja vale neste refresh, igual ao login.
        const companyId = dbUser?.companyId ?? user.companyId ?? null;
        const { modules, writeModules, companyScopes } = resolveAccess(
            dbUser?.roleEntity?.roleModules ?? [],
            dbUser?.modulesOverride,
            companyId,
        );

        const csrfToken = randomBytes(32).toString("hex");
        const token = this.jwtService.sign({
            jti:          uuidv4(),
            csrf:         csrfToken,
            sub:          user.id,
            email:        user.email,
            name:         dbUser?.name ?? user.name,
            surname:      dbUser?.surname ?? user.surname ?? null,
            roleId:       dbUser?.roleId ?? user.roleId,
            modules,
            writeModules,
            companyScopes,
            companyId,
        });
        return { access_token: token, csrfToken };
    }
}
