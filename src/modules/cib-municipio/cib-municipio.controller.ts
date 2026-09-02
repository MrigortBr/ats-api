import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { CibMunicipioService } from "./cib-municipio.service";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@Controller("/cib-municipio")
export class CibMunicipioController {
    constructor(private readonly service: CibMunicipioService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(":uf")
    findByUf(@Param("uf") uf: string) {
        return this.service.findByUf(uf);
    }

    @Put(":id")
    update(
        @Param("id") id: string,
        @Body()
        body: {
            nomeMunicipio?: string;
            regiaoSaude?: string;
            radioterapia?: boolean;
            trsHemodialise?: boolean;
            veiculos?: string;
            ibge?: string;
        },
    ) {
        return this.service.updateById(Number(id), body);
    }
}
