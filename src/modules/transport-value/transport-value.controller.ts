import { SkipThrottle } from "@nestjs/throttler";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TransportValueService } from "./transport-value.service";

@ApiTags("transport-value")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("transport-value")
export class TransportValueController {
    constructor(private readonly service: TransportValueService) {}

    @Get()
    @ApiOperation({ summary: "Lista valores unitarios dos veiculos (van, ambulancia, micro-onibus)" })
    @ApiResponse({ status: 200, description: "Lista de valores por tipo de veiculo" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 403, description: "Sem acesso ao modulo transporte" })
    findAll() {
        return this.service.findAll();
    }
}
