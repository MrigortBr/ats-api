import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { UfService } from "./uf.service";
import { UpdateUfDto } from "./dto/uf.dto";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@Controller("/uf")
export class UfController {
    constructor(private readonly service: UfService) {}

    @Get(":id")
    findById(@Param("id") id: string) {
        return this.service.findById(Number(id));
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateUfDto) {
        return this.service.update(Number(id), dto);
    }
}
