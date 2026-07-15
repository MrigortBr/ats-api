import { Controller, Get, UseGuards } from "@nestjs/common";
import { RoleService } from "./role.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
@Controller("/roles")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("admin")
export class RoleController {
    constructor(private readonly service: RoleService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }
}
