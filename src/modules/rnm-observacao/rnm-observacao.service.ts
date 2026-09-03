import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RnmObservacao } from "./entities/rnm-observacao.entity";
import { RnmObservacaoImagem } from "./entities/rnm-observacao-imagem.entity";
import type { MulterFile } from "../../common/types/multer-file.type";

const IMAGEM_SELECT = {
    id: true, filename: true, mimetype: true, size: true, uploadedBy: true, createdAt: true,
} as const;

@Injectable()
export class RnmObservacaoService {
    constructor(
        @InjectRepository(RnmObservacao)
        private readonly repo: Repository<RnmObservacao>,
        @InjectRepository(RnmObservacaoImagem)
        private readonly imagemRepo: Repository<RnmObservacaoImagem>,
    ) {}

    /** Todas as observações — para enriquecer a listagem do frontend de uma vez (evita N+1 fetch por linha). */
    findAll(): Promise<RnmObservacao[]> {
        return this.repo.find({
            order: { createdAt: "DESC" },
            relations: { imagens: true },
            select: { imagens: IMAGEM_SELECT },
        });
    }

    /** Observações de um hospital específico (por hospitalId). */
    findByHospitalId(hospitalId: number): Promise<RnmObservacao[]> {
        return this.repo.find({
            where: { hospitalId },
            order: { createdAt: "DESC" },
            relations: { imagens: true },
            select: { imagens: IMAGEM_SELECT },
        });
    }

    async create(hospitalId: number, texto: string, autor: string): Promise<RnmObservacao> {
        const observacao = this.repo.create({ hospitalId, texto: texto.trim(), autor });
        const saved = await this.repo.save(observacao);
        return { ...saved, imagens: [] };
    }

    async delete(id: number): Promise<void> {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException(`Observação ${id} não encontrada`);
        await this.repo.remove(item); // cascade de imagens é feito pela FK (ON DELETE CASCADE)
    }

    // ── Imagens ──────────────────────────────────────────────────────────────

    async uploadImagem(observacaoId: number, file: MulterFile, uploadedBy: string) {
        const observacao = await this.repo.findOne({ where: { id: observacaoId } });
        if (!observacao) throw new NotFoundException(`Observação ${observacaoId} não encontrada`);

        const imagem = this.imagemRepo.create({
            observacaoId,
            filename: Buffer.from(file.originalname, "latin1").toString("utf8"),
            mimetype: file.mimetype,
            size: file.size,
            data: file.buffer,
            uploadedBy,
        });
        const saved = await this.imagemRepo.save(imagem);
        return { id: saved.id, filename: saved.filename, mimetype: saved.mimetype, size: saved.size, uploadedBy: saved.uploadedBy, createdAt: saved.createdAt };
    }

    async downloadImagem(id: number): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
        const imagem = await this.imagemRepo.findOne({ where: { id } });
        if (!imagem) throw new NotFoundException(`Imagem ${id} não encontrada`);
        return { buffer: imagem.data, filename: imagem.filename, mimetype: imagem.mimetype };
    }

    async deleteImagem(id: number): Promise<void> {
        const imagem = await this.imagemRepo.findOne({ where: { id } });
        if (!imagem) throw new NotFoundException(`Imagem ${id} não encontrada`);
        await this.imagemRepo.remove(imagem);
    }
}
