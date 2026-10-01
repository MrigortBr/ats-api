import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Body,
    Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { DocumentService } from "./document.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { CompanyScopeGuard } from "../auth/guards/company-scope.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { DocumentType, COMBO_DOCUMENT_TYPES, TOMO_RNM_DOCUMENT_TYPES } from "./document-types";
import type { AuthRequest } from "../../common/types/auth-request.type";

/**
 * Usuario de empresa (escopo de combo restrito a empresas especificas).
 * Admin e gestor geral (escopo null) nao sao restritos.
 */
function escopoEmpresaRestrito(req: AuthRequest): boolean {
    const user = req.user as (AuthRequest["user"] & { companyScopes?: Record<string, number[] | null> }) | undefined;
    if (!user) return true;
    if (Array.isArray(user.modules) && user.modules.includes("admin")) return false;
    return Array.isArray(user.companyScopes?.combo);
}

// ─── COMBO ────────────────────────────────────────────────────────────────────
// Rota inclui :companyId para o CompanyScopeGuard validar acesso.

@UseGuards(JwtAuthGuard, ModuleGuard, CompanyScopeGuard)
@RequiresModule("combo")
@Controller("documents/combo/:companyId/consult/:consultId")
export class DocumentController {
    constructor(private readonly service: DocumentService) {}

    @Post("upload")
    @UseInterceptors(FileInterceptor("file"))
    async uploadCombo(
        @Param("companyId", ParseIntPipe) companyId: number,
        @Param("consultId", ParseIntPipe) consultId: number,
        @Body("documentType") documentType: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: AuthRequest,
    ) {
        if (!file) throw new BadRequestException("Arquivo não enviado");
        if (escopoEmpresaRestrito(req)) {
            await this.service.garantirConsultDaEmpresa(consultId, companyId)
                .catch(async (err) => { await this.service.descartarUpload(file); throw err; });
        }
        if (!(COMBO_DOCUMENT_TYPES as readonly string[]).includes(documentType)) {
            throw new BadRequestException(`Tipo inválido para Combo: ${documentType}`);
        }
        return this.service.upload({
            file,
            documentType: documentType as DocumentType,
            module: "combo",
            uploadedBy: req.user?.email ?? "unknown",
            consultId,
        });
    }

    @Get()
    async listCombo(
        @Param("companyId", ParseIntPipe) companyId: number,
        @Param("consultId", ParseIntPipe) consultId: number,
        @Req() req: AuthRequest,
    ) {
        if (escopoEmpresaRestrito(req)) await this.service.garantirConsultDaEmpresa(consultId, companyId);
        return this.service.findByConsult(consultId);
    }

    @Get(":id/download")
    async downloadCombo(
        @Param("companyId", ParseIntPipe) companyId: number,
        @Param("consultId", ParseIntPipe) consultId: number,
        @Param("id", ParseIntPipe) id: number,
        @Req() req: AuthRequest,
        @Res({ passthrough: true }) _res: Response,
    ) {
        if (escopoEmpresaRestrito(req)) await this.service.garantirConsultDaEmpresa(consultId, companyId);
        const { stream } = await this.service.getStreamable(id, { campo: "consultId", valor: consultId });
        return stream;
    }

    @Delete(":id")
    async removeCombo(
        @Param("companyId", ParseIntPipe) companyId: number,
        @Param("consultId", ParseIntPipe) consultId: number,
        @Param("id", ParseIntPipe) id: number,
        @Req() req: AuthRequest,
    ) {
        if (escopoEmpresaRestrito(req)) await this.service.garantirConsultDaEmpresa(consultId, companyId);
        return this.service.hardDelete(id, { campo: "consultId", valor: consultId });
    }
}

// ─── TOMO ─────────────────────────────────────────────────────────────────────
// Sem :companyId — registros TOMO não são company-specific.

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("tomo")
@Controller("documents/tomo/:tomoId")
export class TomoDocumentController {
    constructor(private readonly service: DocumentService) {}

    @Post("upload")
    @UseInterceptors(FileInterceptor("file"))
    async uploadTomo(
        @Param("tomoId", ParseIntPipe) tomoId: number,
        @Body("documentType") documentType: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: AuthRequest,
    ) {
        if (!file) throw new BadRequestException("Arquivo não enviado");
        if (!(TOMO_RNM_DOCUMENT_TYPES as readonly string[]).includes(documentType)) {
            throw new BadRequestException(`Tipo inválido para TOMO: ${documentType}`);
        }
        return this.service.upload({
            file,
            documentType: documentType as DocumentType,
            module: "tomo",
            uploadedBy: req.user?.email ?? "unknown",
            tomoId,
        });
    }

    @Get()
    listTomo(@Param("tomoId", ParseIntPipe) tomoId: number) {
        return this.service.findByTomo(tomoId);
    }

    @Get(":id/download")
    async downloadTomo(
        @Param("tomoId", ParseIntPipe) tomoId: number,
        @Param("id", ParseIntPipe) id: number,
        @Res({ passthrough: true }) _res: Response,
    ) {
        const { stream } = await this.service.getStreamable(id, { campo: "tomoId", valor: tomoId });
        return stream;
    }

    @Delete(":id")
    removeTomo(
        @Param("tomoId", ParseIntPipe) tomoId: number,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.service.hardDelete(id, { campo: "tomoId", valor: tomoId });
    }
}

// ─── RNM ──────────────────────────────────────────────────────────────────────
// Sem :companyId — registros RNM não são company-specific.

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("rnm")
@Controller("documents/rnm/:rnmId")
export class RnmDocumentController {
    constructor(private readonly service: DocumentService) {}

    @Post("upload")
    @UseInterceptors(FileInterceptor("file"))
    async uploadRnm(
        @Param("rnmId", ParseIntPipe) rnmId: number,
        @Body("documentType") documentType: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: AuthRequest,
    ) {
        if (!file) throw new BadRequestException("Arquivo não enviado");
        if (!(TOMO_RNM_DOCUMENT_TYPES as readonly string[]).includes(documentType)) {
            throw new BadRequestException(`Tipo inválido para RNM: ${documentType}`);
        }
        return this.service.upload({
            file,
            documentType: documentType as DocumentType,
            module: "rnm",
            uploadedBy: req.user?.email ?? "unknown",
            rnmId,
        });
    }

    @Get()
    listRnm(@Param("rnmId", ParseIntPipe) rnmId: number) {
        return this.service.findByRnm(rnmId);
    }

    @Get(":id/download")
    async downloadRnm(
        @Param("rnmId", ParseIntPipe) rnmId: number,
        @Param("id", ParseIntPipe) id: number,
        @Res({ passthrough: true }) _res: Response,
    ) {
        const { stream } = await this.service.getStreamable(id, { campo: "rnmId", valor: rnmId });
        return stream;
    }

    @Delete(":id")
    removeRnm(
        @Param("rnmId", ParseIntPipe) rnmId: number,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.service.hardDelete(id, { campo: "rnmId", valor: rnmId });
    }
}
