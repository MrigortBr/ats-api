import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { EntregaService } from "./entrega.service";
import { UpdateEntregaDto } from "./dto/entrega.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

const EXAMPLE = {
    uf: { id: 1, uf: "AC", state: "Acre", agreement: "ESTADO", cib: "Sim" },
    transport: {
        rtx: { id: 1, ufId: 1, van: 2, ambulance: 1, minibus: 0 },
        trs: { id: 1, ufId: 1, van: 1, microbus: 0 },
        generalQuota: { id: 1, ufId: 1, van: 0, ambulance: 0, microbus: 0 },
    },
    delivered: {
        rtx: { id: 1, ufId: 1, van: 1, ambulance: 0, minibus: 0 },
        trs: { id: 1, ufId: 1, van: 0, microbus: 0 },
        generalQuota: { id: 1, ufId: 1, van: 0, ambulance: 0, microbus: 0 },
    },
};

@ApiTags("Entrega")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/entrega")
export class EntregaController {
    constructor(private readonly service: EntregaService) {}

    @Get()
    @ApiOperation({ summary: "Listar entregas (transport + delivered) por UF" })
    @ApiResponse({ status: 200, schema: { example: { timestamp: "2025-01-01T00:00:00.000Z", message: "OK", data: [EXAMPLE] } } })
    @ApiResponse({ status: 401, description: "Não autenticado" })
    findAll() { return this.service.findAll(); }

    @Get("by-uf/:uf")
    @ApiOperation({ summary: "Buscar entregas por código UF (ex: AC, SP)" })
    findByUfCode(@Param("uf") uf: string) { return this.service.findByUfCode(uf.toUpperCase()); }

    @Get(":ufId")
    @ApiOperation({ summary: "Buscar entregas por UF" })
    @ApiResponse({ status: 200, schema: { example: { timestamp: "2025-01-01T00:00:00.000Z", message: "OK", data: EXAMPLE } } })
    @ApiResponse({ status: 404, description: "UF não encontrada" })
    findByUfId(@Param("ufId", ParseIntPipe) ufId: number) { return this.service.findByUfId(ufId); }

    @Put(":ufId")
        @ApiOperation({ summary: "Atualizar entregas de uma UF (admin/gestor)" })
    @ApiResponse({ status: 200, description: "Entrega atualizada" })
    @ApiResponse({ status: 403, description: "Sem permissão" })
    updateByUfId(@Param("ufId", ParseIntPipe) ufId: number, @Body() body: UpdateEntregaDto) {
        return this.service.updateByUfId(ufId, body);
    }
}
