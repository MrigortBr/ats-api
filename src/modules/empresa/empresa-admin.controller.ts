import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { CompanyScopeGuard } from "../auth/guards/company-scope.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { EmpresaAdminService, AdminUser } from "./empresa-admin.service";
import {
    CreateCompanyAdminDto,
    UpdateCompanyAdminDto,
    CreateCompanyUserDto,
} from "./dto/empresa-admin.dto";

interface AuthRequest extends Request {
    user?: AdminUser;
}

function getUser(req: AuthRequest): AdminUser {
    const u = req.user;
    if (!u) throw new Error("Usuario nao autenticado");
    return u;
}

@ApiTags("Empresa Admin")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("gestor")
@Controller("/empresa/gestor")
export class EmpresaAdminController {
    constructor(private readonly service: EmpresaAdminService) {}

    // ─── Companies ─────────────────────────────────────────────────────────

    @Get("companies")
    @ApiOperation({ summary: "Lista empresas no escopo do gestor" })
    findCompanies(@Req() req: AuthRequest) {
        return this.service.findCompanies(getUser(req));
    }

    @Post("companies")
    @ApiOperation({ summary: "Criar empresa (gestor_geral)" })
    createCompany(
        @Req() req: AuthRequest,
        @Body() body: CreateCompanyAdminDto,
    ) {
        return this.service.createCompany(getUser(req), body);
    }

    @Delete("companies/:companyId")
    @HttpCode(204)
    @ApiOperation({ summary: "Inativar empresa (soft-delete, gestor_geral)" })
    removeCompany(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
    ) {
        return this.service.removeCompany(getUser(req), companyId);
    }

    @Put("companies/:companyId")
    @UseGuards(CompanyScopeGuard)
    @ApiOperation({ summary: "Atualizar empresa no escopo" })
    updateCompany(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
        @Body() body: UpdateCompanyAdminDto,
    ) {
        return this.service.updateCompany(getUser(req), companyId, body);
    }

    // ─── Users ─────────────────────────────────────────────────────────────

    @Get("companies/:companyId/users")
    @UseGuards(CompanyScopeGuard)
    @ApiOperation({ summary: "Lista usuarios da empresa no escopo" })
    findUsers(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
    ) {
        return this.service.findUsers(getUser(req), companyId);
    }

    @Post("companies/:companyId/users")
    @UseGuards(CompanyScopeGuard)
    @ApiOperation({ summary: "Criar usuario vinculado a empresa" })
    createUser(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
        @Body() body: CreateCompanyUserDto,
    ) {
        return this.service.createUser(getUser(req), companyId, body);
    }

    @Delete("companies/:companyId/users/:userId")
    @UseGuards(CompanyScopeGuard)
    @HttpCode(204)
    @ApiOperation({ summary: "Remover usuario da empresa no escopo" })
    removeUser(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
        @Param("userId", ParseIntPipe) userId: number,
    ) {
        return this.service.removeUser(getUser(req), companyId, userId);
    }
}
