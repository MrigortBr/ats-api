import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { CotaGeralService } from "./cota-geral.service";
import { UpdateCotaGeralDto } from "./dto/cota-geral.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

const EXAMPLE = {
    uf: { id: 1, uf: "AC", state: "Acre", agreement: null, cib: null },
    generalQuota: { id: 1, ufId: 1, van: 0, ambulance: 0, microbus: 0 },
    deliveredGeneralQuota: { id: 1, ufId: 1, van: 0, ambulance: 0, microbus: 0 },
};
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/cota-geral")
export class CotaGeralController {
    constructor(private readonly service: CotaGeralService) {}

    @Get()
    findAll() { return this.service.findAll(); }

    @Get("by-uf/:uf")
    findByUfCode(@Param("uf") uf: string) { return this.service.findByUfCode(uf.toUpperCase()); }

    @Get(":ufId")
    findByUfId(@Param("ufId", ParseIntPipe) ufId: number) { return this.service.findByUfId(ufId); }

    @Put(":ufId")
    updateByUfId(@Param("ufId", ParseIntPipe) ufId: number, @Body() body: UpdateCotaGeralDto) {
        return this.service.updateByUfId(ufId, body);
    }
}
