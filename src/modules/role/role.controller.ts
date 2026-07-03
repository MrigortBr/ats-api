import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RoleService } from "./role.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@ApiTags("roles")
@Controller("/roles")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("admin")
@ApiBearerAuth("bearer")
export class RoleController {
    constructor(private readonly service: RoleService) {}

    @Get()
    @ApiOperation({ summary: "Listar roles com seus módulos (admin)" })
    findAll() {
        return this.service.findAll();
    }
}
