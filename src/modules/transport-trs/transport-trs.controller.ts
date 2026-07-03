import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TransportTrsService } from "./transport-trs.service";
import { TransportTrsDto, UpdateTransportTrsDto } from "./dto/transport-trs.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@ApiTags("transport-trs")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/transport-trs")
export class TransportTrsController {
    constructor(private readonly service: TransportTrsService) {}

    @Get() @ApiOperation({ summary: "Listar transporte TRS" })
    findAll() { return this.service.findAll(); }

    @Get(":id")
    findById(@Param("id", ParseIntPipe) id: number) { return this.service.findById(id); }

    @Post()
    create(@Body() body: TransportTrsDto) { return this.service.create(body); }

    @Put(":id")
    update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateTransportTrsDto) {
        return this.service.update(id, body);
    }

    @Delete(":id")
    remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}
