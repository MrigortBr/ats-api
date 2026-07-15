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
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("gestor")
@Controller("/empresa/gestor")
export class EmpresaAdminController {
    constructor(private readonly service: EmpresaAdminService) {}

    // ─── Companies ─────────────────────────────────────────────────────────

    @Get("companies")
    findCompanies(@Req() req: AuthRequest) {
        return this.service.findCompanies(getUser(req));
    }

    @Post("companies")
    createCompany(
        @Req() req: AuthRequest,
        @Body() body: CreateCompanyAdminDto,
    ) {
        return this.service.createCompany(getUser(req), body);
    }

    @Delete("companies/:companyId")
    @HttpCode(204)
    removeCompany(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
    ) {
        return this.service.removeCompany(getUser(req), companyId);
    }

    @Put("companies/:companyId")
    @UseGuards(CompanyScopeGuard)
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
    findUsers(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
    ) {
        return this.service.findUsers(getUser(req), companyId);
    }

    @Post("companies/:companyId/users")
    @UseGuards(CompanyScopeGuard)
    createUser(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
        @Body() body: CreateCompanyUserDto,
    ) {
        return this.service.createUser(getUser(req), companyId, body);
    }

    @Post("companies/:companyId/users/:userId/resend-credentials")
    @UseGuards(CompanyScopeGuard)
    @HttpCode(204)
    resendCredentials(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
        @Param("userId", ParseIntPipe) userId: number,
    ) {
        return this.service.resendCredentials(getUser(req), companyId, userId);
    }

    @Delete("companies/:companyId/users/:userId")
    @UseGuards(CompanyScopeGuard)
    @HttpCode(204)
    removeUser(
        @Req() req: AuthRequest,
        @Param("companyId", ParseIntPipe) companyId: number,
        @Param("userId", ParseIntPipe) userId: number,
    ) {
        return this.service.removeUser(getUser(req), companyId, userId);
    }
}
