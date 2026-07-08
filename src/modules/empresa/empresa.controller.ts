import {
    Body, Controller, Delete, Get, HttpCode,
    Param, ParseIntPipe, Post, Put, Query, Req, UseGuards,
    ForbiddenException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
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

@ApiTags("Empresa")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("empresa")
@Controller("/empresa")
export class EmpresaController {
    constructor(private readonly service: EmpresaService) {}

    @Get("hospitals")
    @ApiOperation({ summary: "Lista todos os hospitais (para select de criacao)" })
    hospitals() {
        return this.service.findAllHospitals();
    }

    @Get("combo-code")
    @ApiOperation({ summary: "Sugestao de comboCode para a empresa autenticada" })
    comboCodeSuggestion(@Req() req: AuthRequest) {
        return this.service.suggestComboCode(requireCompany(req)).then(code => ({ code }));
    }

    @Post("equipamento")
    @ApiOperation({ summary: "Criar combo + equipamento (empresa)" })
    createEquipamento(@Body() dto: CreateComboCompletoDto, @Req() req: AuthRequest) {
        return this.service.createComboCompleto(dto, requireCompany(req));
    }

    @Post("relatorio")
    @ApiOperation({ summary: "Adicionar equipamento a combo existente (empresa)" })
    addEquipamento(@Body() dto: CreateAdminEquipamentoDto, @Req() req: AuthRequest) {
        return this.service.addEmpresaEquipamento(dto, requireCompany(req));
    }

    @Get("relatorio")
    @ApiOperation({ summary: "Relatorio de equipamentos da empresa" })
    relatorio(@Req() req: AuthRequest) {
        return this.service.findRelatorio(requireCompany(req));
    }

    @Get("contatos")
    @ApiOperation({ summary: "Contatos dos estabelecimentos da empresa" })
    contatos(@Req() req: AuthRequest) {
        return this.service.findContatos(requireCompany(req));
    }

    @Put("relatorio/:id")
    @ApiOperation({ summary: "Atualizar campos do equipamento (NF, serie, termos)" })
    updateEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateEmpresaEquipamentoDto,
        @Req() req: AuthRequest,
    ) {
        return this.service.updateEquipamento(id, dto, requireCompany(req));
    }

    @Put("contatos/:id")
    @ApiOperation({ summary: "Atualizar dados de instalacao e contatos do combo" })
    updateContato(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateEmpresaContatoDto,
        @Req() req: AuthRequest,
    ) {
        return this.service.updateContato(id, dto, requireCompany(req));
    }

    @Get("problemas")
    @ApiOperation({ summary: "Notificacoes de problemas da empresa" })
    findProblemas(@Req() req: AuthRequest) {
        return this.service.findProblemas(requireCompany(req));
    }

    @Post("problemas")
    @ApiOperation({ summary: "Registrar novo problema" })
    createProblem(@Body() dto: CreateEmpresaProblemDto, @Req() req: AuthRequest) {
        return this.service.createProblem(dto, requireCompany(req));
    }

    @Put("problemas/:id")
    @ApiOperation({ summary: "Atualizar problema" })
    updateProblem(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateEmpresaProblemDto,
        @Req() req: AuthRequest,
    ) {
        return this.service.updateProblem(id, dto, requireCompany(req));
    }

    @Delete("problemas/:id")
    @HttpCode(204)
    @ApiOperation({ summary: "Remover problema (soft delete)" })
    async deleteProblem(@Param("id", ParseIntPipe) id: number, @Req() req: AuthRequest) {
        await this.service.deleteProblem(id, requireCompany(req));
    }

    // Admin ----------------------------------------------------------------------

    @Get("admin/hospitals")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Lista todos os hospitais (admin)" })
    adminHospitals() {
        return this.service.findAllHospitals();
    }

    @Get("admin/combo-code")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Sugestao de comboCode para empresa (admin)" })
    adminComboCodeSuggestion(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.suggestComboCode(companyId).then(code => ({ code }));
    }

    @Post("admin/equipamento")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Criar combo + equipamento (admin)" })
    adminCreateEquipamentoCompleto(@Body() dto: CreateComboCompletoDto) {
        if (!dto.companyId) throw new ForbiddenException("companyId obrigatorio para admin");
        return this.service.createComboCompleto(dto, dto.companyId);
    }

    @Get("admin/companies")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Lista empresas com grupo de combo (admin)" })
    adminCompanies() {
        return this.service.findAdminCompanies();
    }

    @Get("admin/relatorio")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Relatorio de equipamentos por empresa (admin)" })
    adminRelatorio(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.findAdminRelatorio(companyId);
    }

    @Post("admin/relatorio")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Criar novo equipamento (admin)" })
    adminCreateEquipamento(@Body() dto: CreateAdminEquipamentoDto) {
        return this.service.createAdminEquipamento(dto);
    }

    @Put("admin/relatorio/:id")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Atualizar equipamento completo (admin)" })
    adminUpdateEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateAdminEquipamentoDto,
    ) {
        return this.service.updateAdminEquipamento(id, dto);
    }

    @Post("admin/relatorio/:id/lock")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Adquirir lock de edicao da linha (admin)" })
    adminLockEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Req() req: AuthRequest,
    ) {
        return this.service.lockEquipamento(id, requireEmail(req));
    }

    @Delete("admin/relatorio/:id/lock")
    @HttpCode(204)
    @RequiresModule("admin")
    @ApiOperation({ summary: "Liberar lock de edicao da linha (admin)" })
    async adminUnlockEquipamento(
        @Param("id", ParseIntPipe) id: number,
        @Req() req: AuthRequest,
    ) {
        await this.service.unlockEquipamento(id, requireEmail(req));
    }

    @Get("admin/contatos")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Contatos de uma empresa (admin)" })
    adminContatos(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.findAdminContatos(companyId);
    }

    @Put("admin/contatos/:id")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Atualizar combo/contato completo (admin)" })
    adminUpdateContato(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateAdminContatoDto,
    ) {
        return this.service.updateAdminContato(id, dto);
    }

    @Get("admin/problemas")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Problemas de uma empresa (admin)" })
    adminProblemas(@Query("companyId", ParseIntPipe) companyId: number) {
        return this.service.findAdminProblemas(companyId);
    }

    @Get("admin/painel")
    @RequiresModule("admin")
    @ApiOperation({ summary: "Panorama geral de entrega agregado (admin)" })
    adminPainel() {
        return this.service.findAdminPainel();
    }
}
