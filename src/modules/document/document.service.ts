import {
    BadRequestException,
    Injectable,
    NotFoundException,
    StreamableFile,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createReadStream, existsSync } from "fs";
import { unlink } from "fs/promises";
import * as path from "path";
import { Document } from "./entities/document.entity";
import {
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    DocumentType,
} from "./document-types";

export interface UploadParams {
    file: Express.Multer.File;
    documentType: DocumentType;
    module: "combo" | "tomo" | "rnm";
    uploadedBy: string;
    consultId?: number | null;
    tomoId?: number | null;
    rnmId?: number | null;
}

@Injectable()
export class DocumentService {
    constructor(
        @InjectRepository(Document)
        private readonly docRepo: Repository<Document>,
    ) {}

    // ── UPLOAD ────────────────────────────────────────────────────────────────

    async upload(params: UploadParams): Promise<Document> {
        const { file, documentType, module, uploadedBy, consultId, tomoId, rnmId } = params;

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Tipo de arquivo não permitido: ${file.mimetype}. Apenas PDF e DOCX são aceitos.`,
            );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(
                `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
            );
        }

        // file.path já é o caminho no volume (configurado pelo Multer DiskStorage)
        const storedPath = file.path;

        const doc = this.docRepo.create({
            originalName: file.originalname,
            storedPath,
            mimeType: file.mimetype,
            documentType,
            module,
            uploadedBy,
            fileSize: file.size,
            consultId: consultId ?? null,
            tomoId: tomoId ?? null,
            rnmId: rnmId ?? null,
        });

        return this.docRepo.save(doc);
    }

    // ── LIST ──────────────────────────────────────────────────────────────────

    async findByConsult(consultId: number): Promise<Document[]> {
        return this.docRepo.find({
            where: { consultId },
            order: { uploadedAt: "DESC" },
        });
    }

    async findByTomo(tomoId: number): Promise<Document[]> {
        return this.docRepo.find({
            where: { tomoId },
            order: { uploadedAt: "DESC" },
        });
    }

    async findByRnm(rnmId: number): Promise<Document[]> {
        return this.docRepo.find({
            where: { rnmId },
            order: { uploadedAt: "DESC" },
        });
    }

    // ── DOWNLOAD ──────────────────────────────────────────────────────────────

    async getStreamable(id: number): Promise<{ stream: StreamableFile; doc: Document }> {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException(`Documento ${id} não encontrado`);

        if (!existsSync(doc.storedPath)) {
            throw new NotFoundException(`Arquivo físico não encontrado para o documento ${id}`);
        }

        const stream = new StreamableFile(createReadStream(doc.storedPath), {
            type: doc.mimeType,
            disposition: `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
        });

        return { stream, doc };
    }

    // ── SOFT DELETE ───────────────────────────────────────────────────────────

    async softDelete(id: number): Promise<void> {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException(`Documento ${id} não encontrado`);
        await this.docRepo.softDelete(id);
        // Arquivo físico permanece no volume (soft-delete apenas marca o registro)
    }

    // ── HARD DELETE (admin) ───────────────────────────────────────────────────

    async hardDelete(id: number): Promise<void> {
        const doc = await this.docRepo.findOne({ where: { id }, withDeleted: true });
        if (!doc) throw new NotFoundException(`Documento ${id} não encontrado`);

        if (existsSync(doc.storedPath)) {
            await unlink(doc.storedPath).catch(() => {
                // ignora erro de IO — registro ainda será removido
            });
        }

        await this.docRepo.remove(doc);
    }
}
