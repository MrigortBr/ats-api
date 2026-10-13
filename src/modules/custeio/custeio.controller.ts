import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import { CusteioService } from "./custeio.service";
import { DistanciaService } from "./distancia.service";
import { CalcularDistanciasDto, CreateCusteioResponsavelDto, SyncCusteioUfDto, UpdateCusteioResponsavelDto } from "./dto/custeio.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@Controller("/custeio")
export class CusteioController {
    constructor(
        private readonly service: CusteioService,
        private readonly distancia: DistanciaService,
    ) {}

    /** UFs que já têm custeio, em ordem alfabética. */
    @Get("ufs")
    ufs() { return this.service.ufsComCusteio(); }

    @Get("by-uf/:uf")
    findByUf(@Param("uf") uf: string) { return this.service.findByUf(uf.toUpperCase()); }

    /** Municípios da base de referência de uma UF (sugestões do cadastro), com a marca de quem já está em algum custeio. */
    @Get("municipios")
    municipios(@Query("uf") uf: string) { return this.service.municipiosPorUf((uf ?? "").toUpperCase()); }

    /** Projeção por macrorregião (planilhas importadas) e municípios a mais de 50 km que ainda não estão no custeio. */
    @Get("comparativo/:uf")
    comparativo(@Param("uf") uf: string) { return this.service.comparativo(uf.toUpperCase()); }

    /** Criação restrita ao admin. */
    @Post("responsaveis")
    @RequiresModule("admin")
    create(@Body() body: CreateCusteioResponsavelDto) { return this.service.createResponsavel(body); }

    /** Distância por estrada (Nominatim + OSRM) de cada município atendido até as referências de RT e HD. Só admin. */
    @Post("distancias")
    @RequiresModule("admin")
    distancias(@Body() body: CalcularDistanciasDto) {
        return this.distancia.calcular(body.uf.toUpperCase(), body.linhas);
    }

    /** Grava o estado final da UF (planilha): cria, atualiza e remove responsáveis numa transação. Só admin. */
    @Put("uf/:uf")
    @RequiresModule("admin")
    syncUf(@Param("uf") uf: string, @Body() body: SyncCusteioUfDto) {
        return this.service.syncUf(uf.toUpperCase(), body);
    }

    /** Edição restrita ao admin (o handler sobrescreve o módulo exigido pela classe). */
    @Put("responsaveis/:id")
    @RequiresModule("admin")
    update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateCusteioResponsavelDto) {
        return this.service.updateResponsavel(id, body);
    }
}
