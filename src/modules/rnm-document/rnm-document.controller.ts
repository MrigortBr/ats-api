import {
    Controller, Delete, Get, Param, Post,
    Req, StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
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
    listByHospital(@Param("hospitalId") hospitalId: string) {
        return this.service.listByHospital(Number(hospitalId));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Delete(":id")
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "Documento removido com sucesso" };
    }
}
