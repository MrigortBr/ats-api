import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { CotaGeralMunicipioService } from "./cota-geral-municipio.service";
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/cota-geral-municipio")
export class CotaGeralMunicipioController {
    constructor(private readonly service: CotaGeralMunicipioService) {}

    @Get()
    findAll() { return this.service.findAll(); }

    @Get(":uf")
    findByUf(@Param("uf") uf: string) { return this.service.findByUf(uf); }

    @Put(":id")
    update(
        @Param("id") id: string,
        @Body() body: { van?: number; ambulancia?: number; microonibus?: number },
    ) {
        return this.service.updateById(Number(id), body);
    }
}
