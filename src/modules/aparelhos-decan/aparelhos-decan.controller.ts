import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { AparelhosDecanService } from "./aparelhos-decan.service";

/**
 * Entregas de equipamentos do DECAN com a produção do relatório — somente usuários logados
 * com acesso ao módulo de Equipamentos (tomo ou rnm), como a lista de aceleradores.
 */
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("tomo", "rnm")
@Controller("/aparelhos-decan")
export class AparelhosDecanController {
    constructor(private readonly service: AparelhosDecanService) {}

    @Get()
    listar() {
        return this.service.listar();
    }
}
