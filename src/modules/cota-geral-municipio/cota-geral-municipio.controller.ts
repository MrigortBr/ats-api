import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CotaGeralMunicipioService } from "./cota-geral-municipio.service";

@ApiTags("Cota Geral - Municípios")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard)
@SkipThrottle()
@Controller("/cota-geral-municipio")
export class CotaGeralMunicipioController {
    constructor(private readonly service: CotaGeralMunicipioService) {}

    @Get()
    @ApiOperation({ summary: "Listar todos os municípios da Cota Geral" })
    findAll() { return this.service.findAll(); }

    @Get(":uf")
    @ApiOperation({ summary: "Listar municípios da Cota Geral por UF" })
    findByUf(@Param("uf") uf: string) { return this.service.findByUf(uf); }

    @Put(":id")
    @ApiOperation({ summary: "Atualizar cota de veículos de um município" })
    update(
        @Param("id") id: string,
        @Body() body: { van?: number; ambulancia?: number; microonibus?: number },
    ) {
        return this.service.updateById(Number(id), body);
    }
}
