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

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
import { CibService } from "./cib.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@ApiTags("CIB")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/cib")
export class CibController {
    constructor(private readonly service: CibService) {}

    // ── Upload ────────────────────────────────────────────────────────────────

    @Post(":ufId")
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
    @ApiParam({ name: "ufId", description: "ID numerico da UF" })
    @ApiBody({
        description: "Arquivo CIB (PDF, DOC ou DOCX, max 20 MB)",
        schema: {
            type: "object",
            required: ["file"],
            properties: {
                file: { type: "string", format: "binary", description: "PDF / DOC / DOCX" },
            },
        },
    })
    @ApiOperation({ summary: "Upload de CIB para uma UF (PDF ou DOC/DOCX)" })
    @ApiResponse({ status: 201, description: "CIB enviado com sucesso" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 403, description: "Sem permissao de escrita no modulo transporte" })
    async upload(
        @Param("ufId") ufId: string,
        @UploadedFile() file: MulterFile,
        @Req() req: Request & { user: { name: string; email: string } },
    ) {
        return this.service.upload(Number(ufId), file, req.user.name ?? req.user.email);
    }

    // ── Download ──────────────────────────────────────────────────────────────
    // IMPORTANT: static segment "file/:id" must be registered BEFORE the
    // parameterized ":ufId" route so NestJS/Express does not match
    // GET /cib/file/7 as ufId="file".

    @Get("file/:id")
    @ApiParam({ name: "id", description: "ID do CIB" })
    @ApiOperation({ summary: "Download de um CIB pelo ID" })
    @ApiResponse({ status: 200, description: "Arquivo retornado como octet-stream" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 404, description: "CIB nao encontrado" })
    async download(@Param("id") id: string): Promise<StreamableFile> {
        const { buffer, filename, mimetype } = await this.service.download(Number(id));
        return new StreamableFile(buffer, {
            type:        mimetype,
            disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
            length:      buffer.length,
        });
    }

    // ── Listar metadados por UF ───────────────────────────────────────────────

    @Get(":ufId")
    @ApiParam({ name: "ufId", description: "ID numerico da UF" })
    @ApiOperation({ summary: "Listar CIBs de uma UF (sem o conteudo do arquivo)" })
    @ApiResponse({ status: 200, description: "Lista de metadados dos CIBs" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    listByUf(@Param("ufId") ufId: string) {
        return this.service.listByUf(Number(ufId));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Delete(":id")
    @ApiParam({ name: "id", description: "ID do CIB" })
    @ApiOperation({ summary: "Deletar um CIB pelo ID" })
    @ApiResponse({ status: 200, description: "CIB removido com sucesso" })
    @ApiResponse({ status: 401, description: "Nao autenticado" })
    @ApiResponse({ status: 403, description: "Sem permissao de escrita no modulo transporte" })
    @ApiResponse({ status: 404, description: "CIB nao encontrado" })
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "CIB removido com sucesso" };
    }
}
