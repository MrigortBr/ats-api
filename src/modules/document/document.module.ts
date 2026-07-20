import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { Reflector } from "@nestjs/core";
import { Document } from "./entities/document.entity";
import { DocumentService } from "./document.service";
import {
    DocumentController,
    TomoDocumentController,
    RnmDocumentController,
} from "./document.controller";

const UPLOADS_ROOT = process.env["UPLOADS_ROOT"] ?? "/atslog/uploads";

/**
 * Extrai o módulo e o entityId do caminho da requisição.
 * Padrões esperados:
 *   /documents/combo/:companyId/consult/:consultId/upload  → combo / consultId
 *   /documents/tomo/:companyId/tomo/:tomoId/upload         → tomo  / tomoId
 *   /documents/rnm/:companyId/rnm/:rnmId/upload            → rnm   / rnmId
 */
function resolveDestination(url: string): { mod: string; entityId: string } {
    const parts = url.split("/").filter(Boolean);
    // parts[0] = "documents", parts[1] = module
    const mod = parts[1] ?? "misc";
    // last segment before "upload" is the entity id
    const uploadIdx = parts.indexOf("upload");
    const entityId = uploadIdx > 0 ? (parts[uploadIdx - 1] ?? "0") : "0";
    return { mod, entityId };
}

@Module({
    imports: [
        TypeOrmModule.forFeature([Document]),
        MulterModule.register({
            storage: diskStorage({
                destination(req, _file, cb) {
                    const { mod, entityId } = resolveDestination(req.url);
                    const dest = join(UPLOADS_ROOT, mod, entityId);
                    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
                    cb(null, dest);
                },
                filename(_req, file, cb) {
                    const ext = extname(file.originalname);
                    cb(null, `${uuidv4()}${ext}`);
                },
            }),
            limits: { fileSize: 20 * 1024 * 1024 },
        }),
    ],
    providers: [DocumentService, Reflector],
    controllers: [DocumentController, TomoDocumentController, RnmDocumentController],
    exports: [DocumentService],
})
export class DocumentModule {}
