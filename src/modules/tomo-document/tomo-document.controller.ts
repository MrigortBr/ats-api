import {
    Controller, Delete, Get, Param, Post,
    Req, StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { TomoDocumentService } from "./tomo-document.service";
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
@Controller("/tomo-doc")
export class TomoDocumentController {
    constructor(private readonly service: TomoDocumentService) {}

    @Post(":hospitalId")
    @UseInterceptors(FileInterceptor("file", {
        limits: { fileSize: 20 * 1024 * 1024 },
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

    @Get("file/:id")
    async download(@Param("id") id: string): Promise<StreamableFile> {
        const { buffer, filename, mimetype } = await this.service.download(Number(id));
        return new StreamableFile(buffer, {
            type:        mimetype,
            disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
            length:      buffer.length,
        });
    }

    @Get(":hospitalId")
    listByHospital(@Param("hospitalId") hospitalId: string) {
        return this.service.listByHospital(Number(hospitalId));
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "Documento removido com sucesso" };
    }
}
