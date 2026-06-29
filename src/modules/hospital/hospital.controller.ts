import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HospitalService } from "./hospital.service";
import { CreateHospitalDto, BulkCreateHospitalDto, UpdateHospitalTomoDto, UpdateHospitalRnmDto, UpdateHospitalDto, UpdateHospitalComboDto, CreateHospitalComboDto } from "./dto/hospital.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Hospital TOMO/RNM")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("/hospital")
export class HospitalController {
    constructor(private readonly service: HospitalService) {}

    // ── Lookup (preview sem persistir) ────────────────────────────────────────

    @Get("lookup/:cnes")
    @Roles("admin", "gestor_tomo", "gestor_all")
    @ApiOperation({ summary: "Busca dados do CNES via DEMAS (preview, sem salvar)" })
    @ApiResponse({ status: 200, description: "Dados do estabelecimento" })
    @ApiResponse({ status: 404, description: "CNES não encontrado" })
    lookup(@Param("cnes") cnes: string) {
        return this.service.lookup(cnes);
    }

    // ── Listar tabela TOMO ────────────────────────────────────────────────────

    @Get("tomo")
    @Roles("admin", "gestor_tomo", "gestor_all", "visualizador_tomo", "visualizador_all")
    @ApiOperation({ summary: "Listar todos os hospitais com dados TOMO" })
    findAllTomo() {
        return this.service.findAllTomo();
    }

    // ── Listar tabela RNM ─────────────────────────────────────────────────────

    @Get("rnm")
    @Roles("admin", "gestor_tomo", "gestor_all", "visualizador_tomo", "visualizador_all")
    @ApiOperation({ summary: "Listar todos os hospitais com dados RNM" })
    findAllRnm() {
        return this.service.findAllRnm();
    }

    // ── Criar hospital (single) ───────────────────────────────────────────────

    @Post()
    @Roles("admin", "gestor_tomo", "gestor_all")
    @ApiOperation({ summary: "Cadastrar novo hospital via CNES (admin/gestor_tomo)" })
    @ApiResponse({ status: 201, description: "Hospital cadastrado" })
    @ApiResponse({ status: 400, description: "CNES inválido ou já cadastrado" })
    create(@Body() dto: CreateHospitalDto) {
        return this.service.registerForModule(dto.cnes, dto.module, dto.tomo);
    }

    // ── Importação em massa ───────────────────────────────────────────────────

    @Post("bulk")
    @Roles("admin")
    @ApiOperation({ summary: "Importar múltiplos hospitais por array de CNES (admin)" })
    @ApiResponse({ status: 201, description: "Resultado da importação: created, skipped, errors" })
    bulkCreate(@Body() dto: BulkCreateHospitalDto) {
        return this.service.bulkCreate(dto.cnesList);
    }

    // ── Atualizar hospital base ───────────────────────────────────────────────

    @Patch(":id")
    @Roles("admin")
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
    @Roles("admin", "gestor_tomo", "gestor_all")
    @ApiOperation({ summary: "Atualizar dados TOMO de um hospital" })
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
    @Roles("admin", "gestor_tomo", "gestor_all")
    @ApiOperation({ summary: "Atualizar dados RNM de um hospital" })
    @ApiResponse({ status: 200, description: "Dados RNM atualizados" })
    @ApiResponse({ status: 404, description: "Hospital não encontrado" })
    updateRnm(
        @Param("hospitalId") hospitalId: string,
        @Body() dto: UpdateHospitalRnmDto,
    ) {
        return this.service.updateRnm(Number(hospitalId), dto);
    }

    // ── Criar COMBO ──────────────────────────────────────────────────────────

    @Post("combo")
    @Roles("admin", "gestor_tomo", "gestor_all")
    @ApiOperation({ summary: "Adicionar novo registro COMBO via CNES" })
    @ApiResponse({ status: 201, description: "Registro COMBO criado" })
    createCombo(@Body() dto: CreateHospitalComboDto) {
        return this.service.createCombo(dto);
    }

    // ── Listar COMBO ─────────────────────────────────────────────────────────

    @Get("combo")
    @Roles("admin", "gestor_tomo", "gestor_all", "visualizador_tomo", "visualizador_all")
    @ApiOperation({ summary: "Listar todos os registros COMBO" })
    findAllCombo() {
        return this.service.findAllCombo();
    }

    // ── Atualizar COMBO ───────────────────────────────────────────────────────

    @Put("combo/:id")
    @Roles("admin", "gestor_tomo", "gestor_all")
    @ApiOperation({ summary: "Atualizar dados de um registro COMBO pelo id do combo" })
    @ApiResponse({ status: 200, description: "Dados COMBO atualizados" })
    @ApiResponse({ status: 404, description: "Registro COMBO não encontrado" })
    updateCombo(
        @Param("id") id: string,
        @Body() dto: UpdateHospitalComboDto,
    ) {
        return this.service.updateCombo(Number(id), dto);
    }

    // ── Deletar hospital ──────────────────────────────────────────────────────

    @Delete(":id")
    @Roles("admin")
    @HttpCode(204)
    @ApiOperation({ summary: "Remover hospital e todos os seus registros (admin)" })
    @ApiResponse({ status: 204, description: "Hospital removido" })
    @ApiResponse({ status: 404, description: "Hospital não encontrado" })
    deleteHospital(@Param("id") id: string) {
        return this.service.deleteHospital(Number(id));
    }
}
