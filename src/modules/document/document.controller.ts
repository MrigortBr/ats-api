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
import { SkipThrottle } from "@nestjs/throttler";
import type { Response, Request } from "express";
import { DocumentService } from "./document.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { CompanyScopeGuard } from "../auth/guards/company-scope.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { DocumentType, COMBO_DOCUMENT_TYPES, TOMO_RNM_DOCUMENT_TYPES } from "./document-types";

interface AuthRequest extends Request {
    user?: { id: number; email: string; modules: string[]; companyId?: number | null };
}

// ─── COMBO ────────────────────────────────────────────────────────────────────
// Rota inclui :companyId para o CompanyScopeGuard validar acesso.

@SkipThrottle()
@UseGuards(JwtAuthGuard, ModuleGuard, CompanyScopeGuard)
@RequiresModule("combo")
@Controller("documents/combo/:companyId/consult/:consultId")
export class DocumentController {
    constructor(private readonly service: DocumentService) {}

    @Post("upload")
    @UseInterceptors(FileInterceptor("file"))
    async uploadCombo(
        @Param("consultId", ParseIntPipe) consultId: number,
        @Body("documentType") documentType: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: AuthRequest,
    ) {
        if (!file) throw new BadRequestException("Arquivo não enviado");
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
    listCombo(@Param("consultId", ParseIntPipe) consultId: number) {
        return this.service.findByConsult(consultId);
    }

    @Get(":id/download")
    async downloadCombo(
        @Param("id", ParseIntPipe) id: number,
        @Res({ passthrough: true }) _res: Response,
    ) {
        const { stream } = await this.service.getStreamable(id);
        return stream;
    }

    @Delete(":id")
    removeCombo(@Param("id", ParseIntPipe) id: number) {
        return this.service.softDelete(id);
    }
}

// ─── TOMO ─────────────────────────────────────────────────────────────────────
// Sem :companyId — registros TOMO não são company-specific.

@SkipThrottle()
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
        @Param("id", ParseIntPipe) id: number,
        @Res({ passthrough: true }) _res: Response,
    ) {
        const { stream } = await this.service.getStreamable(id);
        return stream;
    }

    @Delete(":id")
    removeTomo(@Param("id", ParseIntPipe) id: number) {
        return this.service.softDelete(id);
    }
}

// ─── RNM ──────────────────────────────────────────────────────────────────────
// Sem :companyId — registros RNM não são company-specific.

@SkipThrottle()
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
        @Param("id", ParseIntPipe) id: number,
        @Res({ passthrough: true }) _res: Response,
    ) {
        const { stream } = await this.service.getStreamable(id);
        return stream;
    }

    @Delete(":id")
    removeRnm(@Param("id", ParseIntPipe) id: number) {
        return this.service.softDelete(id);
    }
}
