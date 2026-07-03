import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UfService } from "./uf.service";
import { UpdateUfDto } from "./dto/uf.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@ApiTags("uf")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/uf")
export class UfController {
    constructor(private readonly service: UfService) {}

    @Get()
    @ApiOperation({ summary: "Listar todas as UFs" })
    findAll() { return this.service.findAll(); }

    @Get(":id")
    @ApiOperation({ summary: "Buscar UF por ID" })
    findById(@Param("id", ParseIntPipe) id: number) { return this.service.findById(id); }

    @Put(":id")
        @ApiOperation({ summary: "Atualizar agreement e cib de uma UF" })
    update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateUfDto) {
        return this.service.update(id, body);
    }
}
