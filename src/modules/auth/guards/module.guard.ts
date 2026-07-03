import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MODULE_KEY } from "../decorators/requires-module.decorator";
import type { ModuleName } from "../../role/entities/role-module.entity";

interface JwtUser {
    id: number;
    email: string;
    roleId: number | null;
    modules: string[];
    companyId: number | null;
}

/**
 * Guard que verifica se o JWT do usuário contém o módulo exigido pelo endpoint.
 * Deve ser usado APÓS JwtAuthGuard.
 */
@Injectable()
export class ModuleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredModule = this.reflector.getAllAndOverride<ModuleName | undefined>(
            MODULE_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Sem decorator → rota pública (ou protegida só por JWT)
        if (!requiredModule) return true;

        const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
        const user = request.user;

        if (!user) throw new ForbiddenException("Usuário não autenticado");

        const hasModule = Array.isArray(user.modules) && user.modules.includes(requiredModule);

        if (!hasModule) {
            throw new ForbiddenException(
                `Acesso negado: módulo '${requiredModule}' não disponível para este usuário`,
            );
        }

        return true;
    }
}
