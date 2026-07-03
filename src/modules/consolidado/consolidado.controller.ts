import { SkipThrottle } from "@nestjs/throttler";
import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ConsolidadoService } from "./consolidado.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

const EXAMPLE = {
    uf: { id: 1, uf: "AC", state: "Acre", agreement: null, cib: null },
    rtx: { id: 1, ufId: 1, van: 2, ambulance: 1, minibus: 0 },
    trs: { id: 1, ufId: 1, van: 1, microbus: 0 },
    generalQuota: { id: 1, ufId: 1, van: 0, ambulance: 0, microbus: 0 },
};

@ApiTags("Consolidado")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard)
@SkipThrottle()
@Controller("/consolidado")
export class ConsolidadoController {
    constructor(private readonly service: ConsolidadoService) {}

    @Get()
    @ApiOperation({ summary: "Visão consolidada (RTX + TRS + cota geral) por UF — somente leitura" })
    @ApiResponse({ status: 200, schema: { example: { timestamp: "2025-01-01T00:00:00.000Z", message: "OK", data: [EXAMPLE] } } })
    @ApiResponse({ status: 401, description: "Não autenticado" })
    findAll() { return this.service.findAll(); }

    @Get(":ufId")
    @ApiOperation({ summary: "Consolidado de uma UF específica" })
    @ApiResponse({ status: 200, schema: { example: { timestamp: "2025-01-01T00:00:00.000Z", message: "OK", data: EXAMPLE } } })
    @ApiResponse({ status: 404, description: "UF não encontrada" })
    findByUfId(@Param("ufId", ParseIntPipe) ufId: number) { return this.service.findByUfId(ufId); }
}
