import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { HospitalService } from "./hospital.service";
import { CreateHospitalDto, BulkCreateHospitalDto, UpdateHospitalTomoDto, UpdateHospitalRnmDto, UpdateHospitalDto, CreateComboConsultDto, UpdateComboConsultDto } from "./dto/hospital.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

interface AuthRequest extends Request {
    user?: { id: number; email: string; roleId?: number | null; modules: string[]; companyId?: number | null };
}
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("tomo")
@SkipThrottle()
@Controller("/hospital")
export class HospitalController {
    constructor(private readonly service: HospitalService) {}

    // ── Lookup ────────────────────────────────────────────────────────────────

    @Get("lookup/:cnes")
    lookup(@Param("cnes") cnes: string) {
        return this.service.lookup(cnes);
    }

    // ── TOMO ──────────────────────────────────────────────────────────────────

    @Get("tomo")
    findAllTomo() { return this.service.findAllTomo(); }

    @Get("tomo/by-uf/:uf")
    findTomoByUf(@Param("uf") uf: string) { return this.service.findTomoByUf(uf.toUpperCase()); }

    // ── RNM ───────────────────────────────────────────────────────────────────

    @Get("rnm")
    findAllRnm() { return this.service.findAllRnm(); }

    @Get("rnm/by-uf/:uf")
    findRnmByUf(@Param("uf") uf: string) { return this.service.findRnmByUf(uf.toUpperCase()); }

    // ── Criar hospital ────────────────────────────────────────────────────────

    @Post()
    create(@Body() dto: CreateHospitalDto) {
        return this.service.registerForModule(dto.cnes, dto.module, dto.tomo);
    }

    // ── Importação em massa (admin) ───────────────────────────────────────────

    @Post("bulk")
    @RequiresModule("admin")
    bulkCreate(@Body() dto: BulkCreateHospitalDto) {
        return this.service.bulkCreate(dto.cnesList);
    }

    // ── Atualizar hospital base (admin) ───────────────────────────────────────

    @Patch(":id")
    @RequiresModule("admin")
    updateHospital(@Param("id") id: string, @Body() dto: UpdateHospitalDto) {
        return this.service.updateHospital(Number(id), dto);
    }

    // ── Atualizar TOMO ────────────────────────────────────────────────────────

    @Put(":hospitalId/tomo")
    updateTomo(@Param("hospitalId") hospitalId: string, @Body() dto: UpdateHospitalTomoDto) {
        return this.service.updateTomo(Number(hospitalId), dto);
    }

    // ── Atualizar RNM ─────────────────────────────────────────────────────────

    @Put(":hospitalId/rnm")
    updateRnm(@Param("hospitalId") hospitalId: string, @Body() dto: UpdateHospitalRnmDto) {
        return this.service.updateRnm(Number(hospitalId), dto);
    }

    // ── COMBO — lê e filtra por companyId do usuário ──────────────────────────

    @Post("combo")
    @RequiresModule("combo")
    createCombo(@Body() dto: CreateComboConsultDto, @Req() req: AuthRequest) {
        return this.service.createCombo(dto, req.user?.companyId);
    }

    @Get("combo")
    @RequiresModule("combo")
    findAllCombo(@Req() req: AuthRequest) {
        return this.service.findAllCombo(req.user?.companyId);
    }

    @Get("combo/by-uf/:uf")
    @RequiresModule("combo")
    findComboByUf(@Param("uf") uf: string, @Req() req: AuthRequest) {
        return this.service.findComboByUf(uf.toUpperCase(), req.user?.companyId);
    }

    @Put("combo/:id")
    @RequiresModule("combo")
    updateCombo(@Param("id") id: string, @Body() dto: UpdateComboConsultDto) {
        return this.service.updateCombo(Number(id), dto);
    }

    // ── Soft deletes ──────────────────────────────────────────────────────────

    @Delete("tomo/:id")
    @HttpCode(204)
    softDeleteTomo(@Param("id") id: string) { return this.service.softDeleteTomo(Number(id)); }

    @Delete("rnm/:id")
    @HttpCode(204)
    softDeleteRnm(@Param("id") id: string) { return this.service.softDeleteRnm(Number(id)); }

    @Delete("combo/:id")
    @RequiresModule("combo")
    @HttpCode(204)
    softDeleteCombo(@Param("id") id: string) { return this.service.softDeleteCombo(Number(id)); }

    // ── Combo Equipamento ─────────────────────────────────────────────────────

    @Get("combo-equipamento")
    @RequiresModule("combo")
    findAllEquipamentos(@Req() req: AuthRequest) {
        return this.service.findAllEquipamentos(req.user?.companyId);
    }

    @Post("combo-equipamento")
    @RequiresModule("combo")
    createEquipamento(@Body() dto: CreateComboConsultDto) {
        return this.service.createEquipamento(dto);
    }

    @Get("combo/:estabKey/equipamentos")
    @RequiresModule("combo")
    findEquipamentosByCombo(@Param("estabKey") estabKey: string) {
        return this.service.findEquipamentosByCombo(estabKey);
    }

    @Put("combo-equipamento/:id")
    @RequiresModule("combo")
    updateEquipamento(@Param("id") id: string, @Body() dto: UpdateComboConsultDto) {
        return this.service.updateEquipamento(Number(id), dto);
    }

    @Delete("combo-equipamento/:id")
    @RequiresModule("combo")
    @HttpCode(204)
    softDeleteEquipamento(@Param("id") id: string) { return this.service.softDeleteEquipamento(Number(id)); }

    // ── Hard delete hospital (admin) ──────────────────────────────────────────

    @Delete(":id")
    @RequiresModule("admin")
    @HttpCode(204)
    deleteHospital(@Param("id") id: string) { return this.service.deleteHospital(Number(id)); }
}
