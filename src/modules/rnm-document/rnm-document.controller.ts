import {
    Controller, Delete, Get, Param, Post,
    Req, StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { RnmDocumentService } from "./rnm-document.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

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
@UseGuards(JwtAuthGuard)
@Controller("/rnm-doc")
export class RnmDocumentController {
    constructor(private readonly service: RnmDocumentService) {}

    // ── Upload ────────────────────────────────────────────────────────────────

    @Post(":hospitalId")
    @UseGuards(RolesGuard)
    @Roles("admin", "gestor_tomo", "gestor_all", "gestor_all_combo")
    @UseInterceptors(FileInterceptor("file", {
        limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
        fileFilter: (_req, _file, cb) => cb(null, true), // aceita qualquer tipo
    }))
    @ApiConsumes("multipart/form-data")
    @ApiOperation({ summary: "Upload de formulário RNM para um hospital" })
    async upload(
        @Param("hospitalId") hospitalId: string,
        @UploadedFile() file: MulterFile,
        @Req() req: Request & { user: { name: string; email: string } },
    ) {
        return this.service.upload(Number(hospitalId), file, req.user.name ?? req.user.email);
    }

    // ── Download ──────────────────────────────────────────────────────────────
    // Rota estática "file/:id" deve vir ANTES de ":hospitalId"

    @Get("file/:id")
    @ApiOperation({ summary: "Download de um formulário RNM pelo ID" })
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
    @ApiOperation({ summary: "Listar formulários RNM de um hospital (sem o conteúdo)" })
    listByHospital(@Param("hospitalId") hospitalId: string) {
        return this.service.listByHospital(Number(hospitalId));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Delete(":id")
    @UseGuards(RolesGuard)
    @Roles("admin", "gestor_tomo", "gestor_all", "gestor_all_combo")
    @ApiOperation({ summary: "Deletar um formulário RNM pelo ID" })
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "Documento removido com sucesso" };
    }
}
