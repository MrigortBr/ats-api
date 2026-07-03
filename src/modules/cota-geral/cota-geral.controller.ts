import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
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

@ApiTags("Cota Geral")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/cota-geral")
export class CotaGeralController {
    constructor(private readonly service: CotaGeralService) {}

    @Get()
    @ApiOperation({ summary: "Listar cota geral e entregas geral por UF" })
    @ApiResponse({ status: 200, schema: { example: { timestamp: "2025-01-01T00:00:00.000Z", message: "OK", data: [EXAMPLE] } } })
    @ApiResponse({ status: 401, description: "Não autenticado" })
    findAll() { return this.service.findAll(); }

    @Get("by-uf/:uf")
    @ApiOperation({ summary: "Buscar cota geral por código UF, incluindo municípios" })
    @ApiResponse({ status: 200, description: "UF com totais e lista de municípios" })
    @ApiResponse({ status: 404, description: "UF não encontrada" })
    findByUfCode(@Param("uf") uf: string) { return this.service.findByUfCode(uf.toUpperCase()); }

    @Get(":ufId")
    @ApiOperation({ summary: "Buscar cota geral por UF" })
    @ApiResponse({ status: 200, schema: { example: { timestamp: "2025-01-01T00:00:00.000Z", message: "OK", data: EXAMPLE } } })
    @ApiResponse({ status: 404, description: "UF não encontrada" })
    findByUfId(@Param("ufId", ParseIntPipe) ufId: number) { return this.service.findByUfId(ufId); }

    @Put(":ufId")
        @ApiOperation({ summary: "Atualizar cota geral e/ou entregues de uma UF (admin/gestor)" })
    @ApiResponse({ status: 200, description: "Cota geral atualizada" })
    @ApiResponse({ status: 403, description: "Sem permissão" })
    updateByUfId(@Param("ufId", ParseIntPipe) ufId: number, @Body() body: UpdateCotaGeralDto) {
        return this.service.updateByUfId(ufId, body);
    }
}
