import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MODULE_KEY } from "../decorators/requires-module.decorator";
import type { ModuleName } from "../../role/entities/role-module.entity";

interface JwtUser {
    id: number;
    email: string;
    modules: string[];
    writeModules: string[];
    companyScopes: Record<string, number[] | null>;
    companyId: number | null;
}

/**
 * Guard que valida se o usuario tem acesso ao escopo de empresa solicitado.
 *
 * Regras:
 * - Se companyScopes[module] === null  → gestor geral, acesso total.
 * - Se companyScopes[module] === []    → array vazio, sem acesso.
 * - Se companyScopes[module] = [1, 2]  → acesso apenas a essas empresas.
 *
 * O companyId alvo e extraido do route param `:companyId`.
 * Se nao houver param, bloqueia (requer contexto explicito).
 *
 * Deve ser usado APOS JwtAuthGuard e ModuleGuard.
 */
@Injectable()
export class CompanyScopeGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredModule = this.reflector.getAllAndOverride<ModuleName | undefined>(
            MODULE_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredModule) return true;

        const request = context.switchToHttp().getRequest<{
            user?: JwtUser;
            params: Record<string, string>;
        }>();

        const user = request.user;
        if (!user) throw new ForbiddenException("Usuario nao autenticado");

        // Admin é superusuário — acessa qualquer empresa sem restrição de escopo.
        if (Array.isArray(user.modules) && user.modules.includes("admin")) return true;

        const scopes = user.companyScopes;

        // Modulo sem restrição de escopo definida → acesso livre (ex: admin global)
        if (!(requiredModule in scopes)) return true;

        const allowed = scopes[requiredModule];

        // null = gestor geral, acessa todas as empresas
        if (allowed === null) return true;

        const rawParam = request.params["companyId"];
        if (!rawParam) {
            throw new ForbiddenException("Parametro companyId ausente no route");
        }

        const targetCompanyId = parseInt(rawParam, 10);
        if (isNaN(targetCompanyId)) {
            throw new ForbiddenException("companyId invalido");
        }

        if (!allowed.includes(targetCompanyId)) {
            throw new ForbiddenException(
                `Acesso negado: empresa ${targetCompanyId} fora do escopo do usuario`,
            );
        }

        return true;
    }
}
