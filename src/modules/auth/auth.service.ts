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

        // Resolve módulos efetivos: role.roleModules ∪ modulesOverride
        const effectiveRoleModules = user.roleEntity?.roleModules ?? [];
        const roleModules: string[] = effectiveRoleModules.map((rm) => rm.module);
        const overrides: string[]   = user.modulesOverride ?? [];
        const modules = [...new Set([...roleModules, ...overrides])];
        const writeModules: string[] = effectiveRoleModules.filter((rm) => rm.canWrite).map((rm) => rm.module);
        const companyScopes = buildCompanyScopes(effectiveRoleModules, user.companyId ?? null);

        const jti = uuidv4();
        const token = this.jwtService.sign({
            jti,
            sub:          user.id,
            email:        user.email,
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
        roleId?: number | null;
        modules?: string[];
        companyId?: number | null;
    }) {
        // Re-lê o usuário para pegar módulos atualizados (ex: admin mudou permissões)
        const dbUser = await this.authRepository.findById(user.id);
        const effectiveRoleModules = dbUser?.roleEntity?.roleModules ?? [];
        const roleModules: string[] = effectiveRoleModules.map((rm) => rm.module);
        const overrides: string[]   = dbUser?.modulesOverride ?? [];
        const modules = [...new Set([...roleModules, ...overrides])];
        const writeModules: string[] = effectiveRoleModules.filter((rm) => rm.canWrite).map((rm) => rm.module);
        const companyScopes = buildCompanyScopes(effectiveRoleModules, user.companyId ?? null);

        const token = this.jwtService.sign({
            jti:          uuidv4(),
            sub:          user.id,
            email:        user.email,
            roleId:       dbUser?.roleId ?? user.roleId,
            modules,
            writeModules,
            companyScopes,
            companyId:    dbUser?.companyId ?? user.companyId,
        });
        return { access_token: token };
    }
}
