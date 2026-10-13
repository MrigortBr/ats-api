import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { ComboProducaoService } from "./combo-producao.service";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("combo")
@Controller("/combo-producao")
export class ComboProducaoController {
    constructor(private readonly service: ComboProducaoService) {}

    @Get()
    todos() {
        return this.service.todos();
    }

    @Get(":cnes")
    porCnes(@Param("cnes") cnes: string) {
        return this.service.porCnes(cnes);
    }
}
