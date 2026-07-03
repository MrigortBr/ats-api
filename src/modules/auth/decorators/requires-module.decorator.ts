import { SetMetadata } from "@nestjs/common";
import type { ModuleName } from "../../role/entities/role-module.entity";

export const MODULE_KEY = "required_module";

/**
 * Decorator que marca qual módulo do sistema é necessário para acessar o endpoint.
 * Usado em conjunto com ModuleGuard.
 *
 * @example
 * \@RequiresModule('tomo')
 * \@UseGuards(JwtAuthGuard, ModuleGuard)
 */
export const RequiresModule = (module: ModuleName) => SetMetadata(MODULE_KEY, module);
