import { SetMetadata } from "@nestjs/common";
import type { ModuleName } from "../../role/entities/role-module.entity";

export const MODULE_KEY = "required_module";

/**
 * Decorator que marca quais módulos são necessários para acessar o endpoint.
 * Aceita um ou mais módulos — o usuário precisa ter PELO MENOS UM deles (lógica OR).
 * Usado em conjunto com ModuleGuard.
 *
 * @example
 * \@RequiresModule('tomo')
 * \@RequiresModule('combo', 'empresa')   // OR: combo ou empresa
 * \@UseGuards(JwtAuthGuard, ModuleGuard)
 */
export const RequiresModule = (...modules: ModuleName[]) => SetMetadata(MODULE_KEY, modules);
