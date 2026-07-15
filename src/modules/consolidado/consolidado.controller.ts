import { SkipThrottle } from "@nestjs/throttler";
import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ConsolidadoService } from "./consolidado.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

const EXAMPLE = {
    uf: { id: 1, uf: "AC", state: "Acre", agreement: null, cib: null },
    rtx: { id: 1, ufId: 1, van: 2, ambulance: 1, minibus: 0 },
    trs: { id: 1, ufId: 1, van: 1, microbus: 0 },
    generalQuota: { id: 1, ufId: 1, van: 0, ambulance: 0, microbus: 0 },
};
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/consolidado")
export class ConsolidadoController {
    constructor(private readonly service: ConsolidadoService) {}

    @Get()
    findAll() { return this.service.findAll(); }

    @Get(":ufId")
    findByUfId(@Param("ufId", ParseIntPipe) ufId: number) { return this.service.findByUfId(ufId); }
}
