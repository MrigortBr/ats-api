import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CibDocument } from "./entities/cib-document.entity";
import { MulterFile } from "../../common/types/multer-file.type";

@Injectable()
export class CibService {
    constructor(
        @InjectRepository(CibDocument)
        private readonly repo: Repository<CibDocument>,
    ) {}

    async upload(
        ufId: number,
        file: MulterFile,
        uploadedBy: string,
    ): Promise<{ id: number; filename: string; size: number; createdAt: Date }> {
        const doc = this.repo.create({
            ufId,
            filename:   Buffer.from(file.originalname, "latin1").toString("utf8"),
            mimetype:   file.mimetype,
            size:       file.size,
            data:       file.buffer,
            uploadedBy,
        });
        const saved = await this.repo.save(doc);
        return { id: saved.id, filename: saved.filename, size: saved.size, createdAt: saved.createdAt };
    }

    async listByUf(ufId: number): Promise<{ id: number; filename: string; mimetype: string; size: number; uploadedBy: string; createdAt: Date }[]> {
        const docs = await this.repo.find({
            where: { ufId },
            order: { createdAt: "DESC" },
            select: { id: true, ufId: true, filename: true, mimetype: true, size: true, uploadedBy: true, createdAt: true },
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

    async download(id: number): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
        const doc = await this.repo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException(`CIB #${id} não encontrado`);
        return { buffer: doc.data, filename: doc.filename, mimetype: doc.mimetype };
    }

    async delete(id: number): Promise<void> {
        const doc = await this.repo.findOne({ where: { id } });
        if (!doc) throw new NotFoundException(`CIB #${id} não encontrado`);
        await this.repo.remove(doc);
    }
}
