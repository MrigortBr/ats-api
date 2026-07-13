import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { HospitalService } from "./hospital.service";
import { CreateHospitalDto, BulkCreateHospitalDto, UpdateHospitalTomoDto, UpdateHospitalRnmDto, UpdateHospitalDto, CreateComboConsultDto, UpdateComboConsultDto } from "./dto/hospital.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

interface AuthRequest extends Request {
    user?: { id: number; email: string; roleId?: number | null; modules: string[]; companyId?: number | null };
}

@ApiTags("Hospital TOMO/RNM")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("tomo")
@SkipThrottle()
@Controller("/hospital")
export class HospitalController {
    constructor(private readonly service: HospitalService) {}

    // ── Lookup ────────────────────────────────────────────────────────────────

    @Get("lookup/:cnes")
    @ApiOperation({ summary: "Busca dados do CNES via DEMAS (preview, sem salvar)" })
    lookup(@Param("cnes") cnes: string) {
        return this.service.lookup(cnes);
    }

    // ── TOMO ──────────────────────────────────────────────────────────────────

    @Get("tomo")
    @ApiOperation({ summary: "Listar todos os hospitais com dados TOMO" })
    findAllTomo() { return this.service.findAllTomo(); }

    @Get("tomo/by-uf/:uf")
    @ApiOperation({ summary: "Listar hospitais TOMO por sigla UF" })
    findTomoByUf(@Param("uf") uf: string) { return this.service.findTomoByUf(uf.toUpperCase()); }

    // ── RNM ───────────────────────────────────────────────────────────────────

    @Get("rnm")
    @ApiOperation({ summary: "Listar todos os hospitais com dados RNM" })
    findAllRnm() { return this.service.findAllRnm(); }

    @Get("rnm/by-uf/:uf")
    @ApiOperation({ summary: "Listar hospitais RNM por sigla UF" })
    findRnmByUf(@Param("uf") uf: string) { return this.service.findRnmByUf(uf.toUpperCase()); }

    // ── Criar hospital ────────────────────────────────────────────────────────

    @Post()
    @ApiOperation({ summary: "Cadastrar novo hospital via CNES" })
    @ApiResponse({ status: 201, description: "Hospital cadastrado" })
    create(@Body() dto: CreateHospitalDto) {
        return this.service.registerForModule(dto.cnes, dto.module, dto.tomo);
    }

    // ── Importação em massa (admin) ───────────────────────────────────────────

    @Post("bulk")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Importar múltiplos hospitais por CNES (admin)" })
    bulkCreate(@Body() dto: BulkCreateHospitalDto) {
        return this.service.bulkCreate(dto.cnesList);
    }

    // ── Atualizar hospital base (admin) ───────────────────────────────────────

    @Patch(":id")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Atualizar dados base do hospital (admin)" })
    updateHospital(@Param("id") id: string, @Body() dto: UpdateHospitalDto) {
        return this.service.updateHospital(Number(id), dto);
    }

    // ── Atualizar TOMO ────────────────────────────────────────────────────────

    @Put(":hospitalId/tomo")
    @ApiOperation({ summary: "Atualizar dados TOMO de um hospital" })
    updateTomo(@Param("hospitalId") hospitalId: string, @Body() dto: UpdateHospitalTomoDto) {
        return this.service.updateTomo(Number(hospitalId), dto);
    }

    // ── Atualizar RNM ─────────────────────────────────────────────────────────

    @Put(":hospitalId/rnm")
    @ApiOperation({ summary: "Atualizar dados RNM de um hospital" })
    updateRnm(@Param("hospitalId") hospitalId: string, @Body() dto: UpdateHospitalRnmDto) {
        return this.service.updateRnm(Number(hospitalId), dto);
    }

    // ── COMBO — lê e filtra por companyId do usuário ──────────────────────────

    @Post("combo")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Adicionar novo registro COMBO" })
    createCombo(@Body() dto: CreateComboConsultDto, @Req() req: AuthRequest) {
        return this.service.createCombo(dto, req.user?.companyId);
    }

    @Get("combo")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Listar todos os registros COMBO" })
    findAllCombo(@Req() req: AuthRequest) {
        return this.service.findAllCombo(req.user?.companyId);
    }

    @Get("combo/by-uf/:uf")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Listar registros COMBO por sigla UF" })
    findComboByUf(@Param("uf") uf: string, @Req() req: AuthRequest) {
        return this.service.findComboByUf(uf.toUpperCase(), req.user?.companyId);
    }

    @Put("combo/:id")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Atualizar dados de um registro COMBO" })
    updateCombo(@Param("id") id: string, @Body() dto: UpdateComboConsultDto) {
        return this.service.updateCombo(Number(id), dto);
    }

    // ── Soft deletes ──────────────────────────────────────────────────────────

    @Delete("tomo/:id")
    @HttpCode(204)
    @ApiOperation({ summary: "Inativar registro TOMO (soft delete)" })
    softDeleteTomo(@Param("id") id: string) { return this.service.softDeleteTomo(Number(id)); }

    @Delete("rnm/:id")
    @HttpCode(204)
    @ApiOperation({ summary: "Inativar registro RNM (soft delete)" })
    softDeleteRnm(@Param("id") id: string) { return this.service.softDeleteRnm(Number(id)); }

    @Delete("combo/:id")
    @RequiresModule("combo")
    @HttpCode(204)
    @ApiOperation({ summary: "Inativar registro COMBO (soft delete)" })
    softDeleteCombo(@Param("id") id: string) { return this.service.softDeleteCombo(Number(id)); }

    // ── Combo Equipamento ─────────────────────────────────────────────────────

    @Get("combo-equipamento")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Listar todos os equipamentos (lista global)" })
    findAllEquipamentos(@Req() req: AuthRequest) {
        return this.service.findAllEquipamentos(req.user?.companyId);
    }

    @Post("combo-equipamento")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Criar registro de equipamento COMBO" })
    createEquipamento(@Body() dto: CreateComboConsultDto) {
        return this.service.createEquipamento(dto);
    }

    @Get("combo/:estabKey/equipamentos")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Listar equipamentos de um estabelecimento (por estabKey)" })
    findEquipamentosByCombo(@Param("estabKey") estabKey: string) {
        return this.service.findEquipamentosByCombo(estabKey);
    }

    @Put("combo-equipamento/:id")
    @RequiresModule("combo")
    @ApiOperation({ summary: "Atualizar equipamento" })
    updateEquipamento(@Param("id") id: string, @Body() dto: UpdateComboConsultDto) {
        return this.service.updateEquipamento(Number(id), dto);
    }

    @Delete("combo-equipamento/:id")
    @RequiresModule("combo")
    @HttpCode(204)
    @ApiOperation({ summary: "Inativar equipamento (soft delete)" })
    softDeleteEquipamento(@Param("id") id: string) { return this.service.softDeleteEquipamento(Number(id)); }

    // ── Hard delete hospital (admin) ──────────────────────────────────────────

    @Delete(":id")
    @RequiresModule("admin")
    @HttpCode(204)
    @ApiOperation({ summary: "Remover hospital e todos seus registros (admin)" })
    deleteHospital(@Param("id") id: string) { return this.service.deleteHospital(Number(id)); }
}
