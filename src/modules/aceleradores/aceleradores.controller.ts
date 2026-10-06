import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { AceleradoresService } from "./aceleradores.service";

/**
 * Dados da planilha de aceleradores lineares — somente usuarios logados com
 * acesso ao modulo de Equipamentos (tomo ou rnm).
 */
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("tomo", "rnm")
@Controller("/aceleradores")
export class AceleradoresController {
    constructor(private readonly service: AceleradoresService) {}

    @Get()
    listar() {
        return this.service.listar();
    }
}
