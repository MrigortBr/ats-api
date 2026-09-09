import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { EquipamentoConvenioService } from "./equipamento-convenio.service";
import { ImportSisconvDto, ImportSisproDto } from "./dto/import-equipamento-convenio.dto";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@Controller("/equipamento-convenio")
export class EquipamentoConvenioController {
    constructor(private readonly service: EquipamentoConvenioService) {}

    @Get("sisconv")
    findAllSisconv() {
        return this.service.findAllSisconv();
    }

    @Get("sispro")
    findAllSispro() {
        return this.service.findAllSispro();
    }

    /** Reimportação — substitui todos os registros SISCONV. Restrito a admin. */
    @Post("sisconv/import")
    @RequiresModule("admin")
    importSisconv(@Body() dto: ImportSisconvDto) {
        return this.service.replaceSisconv(dto.rows);
    }

    /** Reimportação — substitui todos os registros SISPRO. Restrito a admin. */
    @Post("sispro/import")
    @RequiresModule("admin")
    importSispro(@Body() dto: ImportSisproDto) {
        return this.service.replaceSispro(dto.rows);
    }
}
