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

/**
 * A qual registro o documento deve pertencer (vem da URL). Evita que alguem
 * baixe ou apague um documento de outro registro apenas trocando o :id.
 */
export interface EscopoDocumento {
    campo: "consultId" | "tomoId" | "rnmId";
    valor: number;
}

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

        // Multer lê o header como latin-1; decodifica para UTF-8 corretamente
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        const doc = this.docRepo.create({
            originalName,
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

    /**
     * Filtra registros cujo arquivo físico não existe mais no volume
     * e remove-os do banco automaticamente (reconciliação passiva).
     */
    private async purgeOrphans(docs: Document[]): Promise<Document[]> {
        const alive: Document[] = [];
        const orphans: Document[] = [];

        for (const doc of docs) {
            if (existsSync(doc.storedPath)) {
                alive.push(doc);
            } else {
                orphans.push(doc);
            }
        }

        if (orphans.length > 0) {
            await this.docRepo.remove(orphans);
        }

        return alive;
    }

    async findByConsult(consultId: number): Promise<Document[]> {
        const docs = await this.docRepo.find({
            where: { consultId },
            order: { uploadedAt: "DESC" },
        });
        return this.purgeOrphans(docs);
    }

    async findByTomo(tomoId: number): Promise<Document[]> {
        const docs = await this.docRepo.find({
            where: { tomoId },
            order: { uploadedAt: "DESC" },
        });
        return this.purgeOrphans(docs);
    }

    async findByRnm(rnmId: number): Promise<Document[]> {
        const docs = await this.docRepo.find({
            where: { rnmId },
            order: { uploadedAt: "DESC" },
        });
        return this.purgeOrphans(docs);
    }

    // ── DOWNLOAD ──────────────────────────────────────────────────────────────

    /** Carrega o documento so se ele pertencer ao registro informado (senao, 404). */
    private async documentoDoEscopo(id: number, escopo: EscopoDocumento, withDeleted = false): Promise<Document> {
        const doc = await this.docRepo.findOne({ where: { id }, withDeleted });
        if (!doc || doc[escopo.campo] !== escopo.valor) {
            throw new NotFoundException(`Documento ${id} não encontrado`);
        }
        return doc;
    }

    /**
     * Confere se o combo (combo_consult) pertence a empresa informada.
     * Usado para usuarios de empresa (escopo restrito) — responde 404 para nao
     * revelar a existencia de registros de outras empresas.
     */
    async garantirConsultDaEmpresa(consultId: number, companyId: number): Promise<void> {
        const [linha] = await this.docRepo.manager.query(
            `SELECT company_id FROM combo_consult WHERE id = $1`,
            [consultId],
        );
        if (!linha || linha.company_id === null || Number(linha.company_id) !== companyId) {
            throw new NotFoundException(`Registro ${consultId} não encontrado`);
        }
    }

    /** Remove do disco um arquivo recebido pelo multer cujo upload foi recusado. */
    async descartarUpload(file: Express.Multer.File | undefined): Promise<void> {
        if (file?.path && existsSync(file.path)) {
            await unlink(file.path).catch(() => undefined);
        }
    }

    async getStreamable(id: number, escopo: EscopoDocumento): Promise<{ stream: StreamableFile; doc: Document }> {
        const doc = await this.documentoDoEscopo(id, escopo);

        if (!existsSync(doc.storedPath)) {
            // arquivo sumiu do volume — remove o metadado órfão e informa o cliente
            await this.docRepo.remove(doc);
            throw new NotFoundException(
                `Arquivo não encontrado no volume. O registro foi removido automaticamente.`,
            );
        }

        const stream = new StreamableFile(createReadStream(doc.storedPath), {
            type: doc.mimeType,
            disposition: `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
        });

        return { stream, doc };
    }

    // ── SOFT DELETE ───────────────────────────────────────────────────────────

    async softDelete(id: number, escopo: EscopoDocumento): Promise<void> {
        await this.documentoDoEscopo(id, escopo);
        await this.docRepo.softDelete(id);
        // Arquivo físico permanece no volume (soft-delete apenas marca o registro)
    }

    // ── HARD DELETE (admin) ───────────────────────────────────────────────────

    async hardDelete(id: number, escopo: EscopoDocumento): Promise<void> {
        const doc = await this.documentoDoEscopo(id, escopo, true);

        if (existsSync(doc.storedPath)) {
            await unlink(doc.storedPath).catch(() => {
                // ignora erro de IO — registro ainda será removido
            });
        }

        await this.docRepo.remove(doc);
    }
}
