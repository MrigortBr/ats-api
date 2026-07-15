import {
    Body, Controller, Delete, Get, HttpCode,
    Param, ParseIntPipe, Post, Put, Query, Req, UseGuards,
    ForbiddenException,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { EmpresaService } from "./empresa.service";
import {
    CreateEmpresaProblemDto,
    UpdateEmpresaProblemDto,
    UpdateEmpresaEquipamentoDto,
    UpdateEmpresaContatoDto,
    UpdateAdminEquipamentoDto,
    UpdateAdminContatoDto,
    CreateAdminEquipamentoDto,
    CreateComboCompletoDto,
} from "./dto/empresa.dto";

interface AuthRequest extends Request {
    user?: { id: number; email: string; modules: string[]; companyId?: number | null };
}

function requireCompany(req: AuthRequest): number {
    const id = req.user?.companyId;
    if (!id) throw new ForbiddenException("Usuario nao vinculado a uma empresa");
    return id;
}

function requireEmail(req: AuthRequest): string {
    const email = req.user?.email;
    if (!email) throw new ForbiddenException("Usuario sem email identificado");
    return email;
}
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("empresa")
@Controller("/empresa")
export class EmpresaController {
    constructor(private readonly service: EmpresaService) {}

    @Get("hospitals")
    hospitals() {
        return this.service.findAllHospitals();
    }

    @Get("combo-code")
    comboCodeSuggestion(@Req() req: AuthRequest) {
        return this.service.suggestComboCode(requireCompany(req)).then(code => ({ code }));
    }

    @Post("equipamento")
    createEquipamento(@Body() dto: CreateComboCompletoDto, @Req() req: AuthRequest) {
        return this.service.createComboCompleto(dto, requireCompany(req));
    }

    @Post("relatorio")
    addEquipamento(@Body() dto: CreateAdminEquipamentoDto, @Req() req: AuthRequest) {
        return this.service.addEmpresaEquipamento(dto, requireCompany(req));
    }

    @Get("relatorio")
    relatorio(@Req() req: AuthRequest) {
        return this.service.findRelatorio(requireCompany(req));
    }

    @Get("contatos")
    contatos(@Req() req: AuthRequest) {
        return this.service.findContatos(requireCompany(req));
    }

    @Put("relatorio/:id")
    updateEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateEmpresaEquipamentoDto,
        @Req() req: AuthRequest,
    ) {
        return this.service.updateEquipamento(id, dto, requireCompany(req));
    }

    @Put("contatos/:id")
    updateContato(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateEmpresaContatoDto,
        @Req() req: AuthRequest,
    ) {
        return this.service.updateContato(id, dto, requireCompany(req));
    }

    @Get("problemas")
    findProblemas(@Req() req: AuthRequest) {
        return this.service.findProblemas(requireCompany(req));
    }

    @Post("problemas")
    createProblem(@Body() dto: CreateEmpresaProblemDto, @Req() req: AuthRequest) {
        return this.service.createProblem(dto, requireCompany(req));
    }

    @Put("problemas/:id")
    updateProblem(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateEmpresaProblemDto,
        @Req() req: AuthRequest,
    ) {
        return this.service.updateProblem(id, dto, requireCompany(req));
    }

    @Delete("problemas/:id")
    @HttpCode(204)
    async deleteProblem(@Param("id", ParseIntPipe) id: number, @Req() req: AuthRequest) {
        await this.service.deleteProblem(id, requireCompany(req));
    }

    @Get("company")
    myCompany(@Req() req: AuthRequest) {
        return this.service.findMyCompany(requireCompany(req));
    }

        // Admin ----------------------------------------------------------------------

    @Get("admin/hospitals")
    @RequiresModule("admin")
    adminHospitals() {
        return this.service.findAllHospitals();
    }

    @Get("admin/combo-code")
    @RequiresModule("admin")
    adminComboCodeSuggestion(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.suggestComboCode(companyId).then(code => ({ code }));
    }

    @Post("admin/equipamento")
    @RequiresModule("admin")
    adminCreateEquipamentoCompleto(@Body() dto: CreateComboCompletoDto) {
        if (!dto.companyId) throw new ForbiddenException("companyId obrigatorio para admin");
        return this.service.createComboCompleto(dto, dto.companyId);
    }

    @Get("admin/companies")
    @RequiresModule("admin")
    adminCompanies() {
        return this.service.findAdminCompanies();
    }

    @Get("admin/relatorio")
    @RequiresModule("admin")
    adminRelatorio(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.findAdminRelatorio(companyId);
    }

    @Post("admin/relatorio")
    @RequiresModule("admin")
    adminCreateEquipamento(@Body() dto: CreateAdminEquipamentoDto) {
        return this.service.createAdminEquipamento(dto);
    }

    @Put("admin/relatorio/:id")
    @RequiresModule("admin")
    adminUpdateEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateAdminEquipamentoDto,
    ) {
        return this.service.updateAdminEquipamento(id, dto);
    }

    @Post("admin/relatorio/:id/lock")
    @RequiresModule("admin")
    adminLockEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Req() req: AuthRequest,
    ) {
        return this.service.lockEquipamento(id, requireEmail(req));
    }

    @Delete("admin/relatorio/:id/lock")
    @HttpCode(204)
    @RequiresModule("admin")
    async adminUnlockEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Req() req: AuthRequest,
    ) {
        await this.service.unlockEquipamento(id, requireEmail(req));
    }

    @Get("admin/contatos")
    @RequiresModule("admin")
    adminContatos(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.findAdminContatos(companyId);
    }

    @Put("admin/contatos/:id")
    @RequiresModule("admin")
    adminUpdateContato(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateAdminContatoDto,
    ) {
        return this.service.updateAdminContato(id, dto);
    }

    @Get("admin/problemas")
    @RequiresModule("admin")
    adminProblemas(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.findAdminProblemas(companyId);
    }

    @Get("admin/painel")
    @RequiresModule("admin")
    adminPainel() {
        return this.service.findAdminPainel();
    }
}
