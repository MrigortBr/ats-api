import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DeliveredGeneralQuotaService } from "./delivered-general-quota.service";
import { DeliveredGeneralQuotaDto, UpdateDeliveredGeneralQuotaDto } from "./dto/delivered-general-quota.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@ApiTags("delivered-general-quota")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/delivered-general-quota")
export class DeliveredGeneralQuotaController {
    constructor(private readonly service: DeliveredGeneralQuotaService) {}

    @Get() @ApiOperation({ summary: "Listar entregas Cota Geral" })
    findAll() { return this.service.findAll(); }

    @Get(":id")
    findById(@Param("id", ParseIntPipe) id: number) { return this.service.findById(id); }

    @Post()
    create(@Body() body: DeliveredGeneralQuotaDto) { return this.service.create(body); }

    @Put(":id")
    update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateDeliveredGeneralQuotaDto) {
        return this.service.update(id, body);
    }

    @Delete(":id")
    remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}
