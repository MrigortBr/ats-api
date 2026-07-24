import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { MulterFile } from "../types/multer-file.type";

/**
 * Shape mínima que uma entidade de documento bytea precisa ter.
 * Tanto TomoDocument quanto RnmDocument satisfazem esta interface.
 */
export interface ByteaDocumentEntity {
    id: number;
    hospitalId: number;
    filename: string;
    mimetype: string;
    size: number;
    data: Buffer;
    uploadedBy: string;
    createdAt: Date;
}

export type UploadResult   = { id: number; filename: string; size: number; createdAt: Date };
export type ListResult     = { id: number; filename: string; mimetype: string; size: number; uploadedBy: string; createdAt: Date };
export type DownloadResult = { buffer: Buffer; filename: string; mimetype: string };

/**
 * Service base genérico para documentos armazenados como bytea no banco.
 * Extenda esta classe passando a entidade concreta como parâmetro.
 *
 * @example
 * export class TomoDocumentService extends ByteaDocumentService<TomoDocument> {}
 */
export class ByteaDocumentService<T extends ByteaDocumentEntity> {
    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private readonly repo: Repository<any>,
        private readonly label: string, // "TOMO" | "RNM" — usado nas mensagens de erro
    ) {}

    async upload(hospitalId: number, file: MulterFile, uploadedBy: string): Promise<UploadResult> {
        const doc = this.repo.create({
            hospitalId,
            filename:   Buffer.from(file.originalname, "latin1").toString("utf8"),
            mimetype:   file.mimetype,
            size:       file.size,
            data:       file.buffer,
            uploadedBy,
        });
        const saved: T = await this.repo.save(doc);
        return { id: saved.id, filename: saved.filename, size: saved.size, createdAt: saved.createdAt };
    }

    async listByHospital(hospitalId: number): Promise<ListResult[]> {
        const docs: T[] = await this.repo.find({
            where:  { hospitalId },
            order:  { createdAt: "DESC" },
            select: { id: true, hospitalId: true, filename: true, mimetype: true, size: true, uploadedBy: true, createdAt: true },
        });
        return docs.map(d => ({
            id:         d.id,
            filename:   d.filename,
            mimetype:   d.mimetype,
            size:       d.size,
            uploadedBy: d.uploadedBy,
            createdAt:  d.createdAt,
        }));
    }

    async download(id: number): Promise<DownloadResult> {
        const doc: T | null = await this.repo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException(`Documento ${this.label} #${id} não encontrado`);
        return { buffer: doc.data, filename: doc.filename, mimetype: doc.mimetype };
    }

    async delete(id: number): Promise<void> {
        const doc: T | null = await this.repo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException(`Documento ${this.label} #${id} não encontrado`);
        await this.repo.remove(doc);
    }
}
