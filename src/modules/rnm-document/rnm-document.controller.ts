import {
    Controller, Delete, Get, Param, Post,
    Req, StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import {
    ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation,
    ApiParam, ApiResponse, ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { RnmDocumentService } from "./rnm-document.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

@ApiTags("RNM Documents")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("tomo")
@SkipThrottle()
@Controller("/rnm-doc")
export class RnmDocumentController {
    constructor(private readonly service: RnmDocumentService) {}

    // ── Upload ────────────────────────────────────────────────────────────────

    @Post(":hospitalId")
    @UseInterceptors(FileInterceptor("file", {
        limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
        fileFilter: (_req, file, cb) => {
            const allowed = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            cb(null, allowed.includes(file.mimetype));
        },
    }))
    @ApiConsumes("multipart/form-data")
    @ApiParam({ name: "hospitalId", description: "ID numerico do hospital" })
    @ApiBody({
        description: "Formulario RNM (PDF, DOC ou DOCX, max 20 MB)",
        schema: {
            type: "object",
            required: ["file"],
            properties: {
                file: { type: "string", format: "binary", description: "PDF / DOC / DOCX" },
            },
        },
    })
    @ApiOperation({ summary: "Upload de formulario RNM para um hospital" })
    @ApiResponse({ status: 201, description: "Formulario enviado com sucesso" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 403, description: "Sem permissao de escrita no modulo tomo" })
    async upload(
        @Param("hospitalId") hospitalId: string,
        @UploadedFile() file: MulterFile,
        @Req() req: Request & { user: { name: string; email: string } },
    ) {
        return this.service.upload(Number(hospitalId), file, req.user.name ?? req.user.email);
    }

    // ── Download ──────────────────────────────────────────────────────────────
    // Rota estatica "file/:id" deve vir ANTES de ":hospitalId"

    @Get("file/:id")
    @ApiParam({ name: "id", description: "ID do documento RNM" })
    @ApiOperation({ summary: "Download de um formulario RNM pelo ID" })
    @ApiResponse({ status: 200, description: "Arquivo retornado como octet-stream" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 404, description: "Documento nao encontrado" })
    async download(@Param("id") id: string): Promise<StreamableFile> {
        const { buffer, filename, mimetype } = await this.service.download(Number(id));
        return new StreamableFile(buffer, {
            type:        mimetype,
            disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
            length:      buffer.length,
        });
    }

    // ── Listar por hospital ───────────────────────────────────────────────────

    @Get(":hospitalId")
    @ApiParam({ name: "hospitalId", description: "ID numerico do hospital" })
    @ApiOperation({ summary: "Listar formularios RNM de um hospital (sem o conteudo)" })
    @ApiResponse({ status: 200, description: "Lista de metadados dos documentos RNM" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    listByHospital(@Param("hospitalId") hospitalId: string) {
        return this.service.listByHospital(Number(hospitalId));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Delete(":id")
    @ApiParam({ name: "id", description: "ID do documento RNM" })
    @ApiOperation({ summary: "Deletar um formulario RNM pelo ID" })
    @ApiResponse({ status: 200, description: "Documento removido com sucesso" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 403, description: "Sem permissao de escrita no modulo tomo" })
    @ApiResponse({ status: 404, description: "Documento nao encontrado" })
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "Documento removido com sucesso" };
    }
}
