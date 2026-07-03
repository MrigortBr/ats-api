import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TransportRtxService } from "./transport-rtx.service";
import { TransportRtxDto, UpdateTransportRtxDto } from "./dto/transport-rtx.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@ApiTags("transport-rtx")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/transport-rtx")
export class TransportRtxController {
    constructor(private readonly service: TransportRtxService) {}

    @Get() @ApiOperation({ summary: "Listar transporte RTx" })
    findAll() { return this.service.findAll(); }

    @Get(":id")
    findById(@Param("id", ParseIntPipe) id: number) { return this.service.findById(id); }

    @Post()
    create(@Body() body: TransportRtxDto) { return this.service.create(body); }

    @Put(":id")
    update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateTransportRtxDto) {
        return this.service.update(id, body);
    }

    @Delete(":id")
    remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}
