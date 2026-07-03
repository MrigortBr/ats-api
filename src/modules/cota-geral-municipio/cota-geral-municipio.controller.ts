import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { CotaGeralMunicipioService } from "./cota-geral-municipio.service";

@ApiTags("Cota Geral - Municipios")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/cota-geral-municipio")
export class CotaGeralMunicipioController {
    constructor(private readonly service: CotaGeralMunicipioService) {}

    @Get()
    @ApiOperation({ summary: "Listar todos os municipios da Cota Geral" })
    @ApiResponse({ status: 200, description: "Lista de municipios com suas cotas" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    findAll() { return this.service.findAll(); }

    @Get(":uf")
    @ApiParam({ name: "uf", description: "Sigla da UF (ex: AC, SP)" })
    @ApiOperation({ summary: "Listar municipios da Cota Geral por UF" })
    @ApiResponse({ status: 200, description: "Municipios da UF com suas cotas" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 404, description: "UF nao encontrada" })
    findByUf(@Param("uf") uf: string) { return this.service.findByUf(uf); }

    @Put(":id")
    @ApiParam({ name: "id", description: "ID numerico do municipio" })
    @ApiBody({
        description: "Campos a atualizar (ao menos um obrigatorio)",
        schema: {
            type: "object",
            properties: {
                van:        { type: "number", example: 2 },
                ambulancia: { type: "number", example: 1 },
                microonibus: { type: "number", example: 0 },
            },
        },
    })
    @ApiOperation({ summary: "Atualizar cota de veiculos de um municipio" })
    @ApiResponse({ status: 200, description: "Cota atualizada" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 403, description: "Sem permissao de escrita no modulo transporte" })
    @ApiResponse({ status: 404, description: "Municipio nao encontrado" })
    update(
        @Param("id") id: string,
        @Body() body: { van?: number; ambulancia?: number; microonibus?: number },
    ) {
        return this.service.updateById(Number(id), body);
    }
}
