import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MODULE_KEY } from "../decorators/requires-module.decorator";
import type { ModuleName } from "../../role/entities/role-module.entity";

interface JwtUser {
    id: number;
    email: string;
    roleId: number | null;
    modules: string[];
    writeModules: string[];
    companyId: number | null;
}

/** Metodos HTTP que alteram estado -- exigem canWrite no modulo. */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Guard que verifica se o JWT do usuario tem acesso ao modulo exigido.
 * - Leitura (GET/HEAD): basta o modulo estar em modules[].
 * - Escrita (POST/PUT/PATCH/DELETE): o modulo tambem deve estar em writeModules[].
 * Deve ser usado APOS JwtAuthGuard.
 */
@Injectable()
export class ModuleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredModule = this.reflector.getAllAndOverride<ModuleName | undefined>(
            MODULE_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredModule) return true;

        const request = context.switchToHttp().getRequest<{ user?: JwtUser; method: string }>();
        const user = request.user;

        if (!user) throw new ForbiddenException("Usuario nao autenticado");

        // Admin é superusuário — acessa qualquer módulo sem restrição de leitura ou escrita.
        if (Array.isArray(user.modules) && user.modules.includes("admin")) return true;

        const hasModule = Array.isArray(user.modules) && user.modules.includes(requiredModule);
        if (!hasModule) {
            throw new ForbiddenException(
                `Acesso negado: modulo '${requiredModule}' nao disponivel para este usuario`,
            );
        }

        if (WRITE_METHODS.has(request.method)) {
            const canWrite = Array.isArray(user.writeModules) && user.writeModules.includes(requiredModule);
            if (!canWrite) {
                throw new ForbiddenException(
                    `Permissao de escrita ausente: modulo '${requiredModule}' e somente leitura para este usuario`,
                );
            }
        }

        return true;
    }
}
