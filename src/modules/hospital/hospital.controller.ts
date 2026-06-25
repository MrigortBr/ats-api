import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HospitalService } from "./hospital.service";
import { CreateHospitalDto, BulkCreateHospitalDto, UpdateHospitalTomoDto, UpdateHospitalRnmDto, UpdateHospitalDto } from "./dto/hospital.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Hospital TOMO/RNM")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Controller("/hospital")
export class HospitalController {
    constructor(private readonly service: HospitalService) {}

    // ── Lookup (preview sem persistir) ────────────────────────────────────────

    @Get("lookup/:cnes")
    @ApiOperation({ summary: "Busca dados do CNES via DEMAS (preview, sem salvar)" })
    @ApiResponse({ status: 200, description: "Dados do estabelecimento" })
    @ApiResponse({ status: 404, description: "CNES não encontrado" })
    lookup(@Param("cnes") cnes: string) {
        return this.service.lookup(cnes);
    }

    // ── Listar tabela TOMO ────────────────────────────────────────────────────

    @Get("tomo")
    @ApiOperation({ summary: "Listar todos os hospitais com dados TOMO" })
    findAllTomo() {
        return this.service.findAllTomo();
    }

    // ── Listar tabela RNM ─────────────────────────────────────────────────────

    @Get("rnm")
    @ApiOperation({ summary: "Listar todos os hospitais com dados RNM" })
    findAllRnm() {
        return this.service.findAllRnm();
    }

    // ── Criar hospital (single) ───────────────────────────────────────────────

    @Post()
    @ApiOperation({ summary: "Cadastrar novo hospital via CNES (admin)" })
    @ApiResponse({ status: 201, description: "Hospital cadastrado" })
    @ApiResponse({ status: 400, description: "CNES inválido ou já cadastrado" })
    create(@Body() dto: CreateHospitalDto) {
        return this.service.registerForModule(dto.cnes, dto.module, dto.tomo);
    }

    // ── Importação em massa ───────────────────────────────────────────────────

    @Post("bulk")
    @ApiOperation({ summary: "Importar múltiplos hospitais por array de CNES (admin)" })
    @ApiResponse({ status: 201, description: "Resultado da importação: created, skipped, errors" })
    bulkCreate(@Body() dto: BulkCreateHospitalDto) {
        return this.service.bulkCreate(dto.cnesList);
    }

    // ── Atualizar hospital base ───────────────────────────────────────────────

    @Patch(":id")
    @ApiOperation({ summary: "Atualizar dados base do hospital (CNES, etc)" })
    @ApiResponse({ status: 200, description: "Hospital atualizado" })
    @ApiResponse({ status: 404, description: "Hospital não encontrado" })
    updateHospital(
        @Param("id") id: string,
        @Body() dto: UpdateHospitalDto,
    ) {
        return this.service.updateHospital(Number(id), dto);
    }

    // ── Atualizar TOMO ────────────────────────────────────────────────────────

    @Put(":hospitalId/tomo")
    @ApiOperation({ summary: "Atualizar dados TOMO de um hospital (admin)" })
    @ApiResponse({ status: 200, description: "Dados TOMO atualizados" })
    @ApiResponse({ status: 404, description: "Hospital não encontrado" })
    updateTomo(
        @Param("hospitalId") hospitalId: string,
        @Body() dto: UpdateHospitalTomoDto,
    ) {
        return this.service.updateTomo(Number(hospitalId), dto);
    }

    // ── Atualizar RNM ─────────────────────────────────────────────────────────

    @Put(":hospitalId/rnm")
    @ApiOperation({ summary: "Atualizar dados RNM de um hospital (admin)" })
    @ApiResponse({ status: 200, description: "Dados RNM atualizados" })
    @ApiResponse({ status: 404, description: "Hospital não encontrado" })
    updateRnm(
        @Param("hospitalId") hospitalId: string,
        @Body() dto: UpdateHospitalRnmDto,
    ) {
        return this.service.updateRnm(Number(hospitalId), dto);
    }

    // ── Deletar hospital ──────────────────────────────────────────────────────

    @Delete(":id")
    @HttpCode(204)
    @ApiOperation({ summary: "Remover hospital e todos os seus registros (admin)" })
    @ApiResponse({ status: 204, description: "Hospital removido" })
    @ApiResponse({ status: 404, description: "Hospital não encontrado" })
    deleteHospital(@Param("id") id: string) {
        return this.service.deleteHospital(Number(id));
    }
}
