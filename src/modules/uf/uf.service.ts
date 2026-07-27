import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UfRepository } from "./uf.repository";
import { UpdateUfDto } from "./dto/uf.dto";
import { UfFluxoComentario } from "./entities/uf-fluxo-comentario.entity";

@Injectable()
export class UfService {
    constructor(
        private readonly repo: UfRepository,
        @InjectRepository(UfFluxoComentario)
        private readonly comentarioRepo: Repository<UfFluxoComentario>,
    ) {}

    findAll() { return this.repo.findAll(); }

    async findById(id: number) {
        const item = await this.repo.findById(id);
        if (!item) throw new NotFoundException(`UF ${id} não encontrada`);
        return item;
    }

    async update(id: number, data: UpdateUfDto) {
        await this.findById(id);
        return this.repo.update(id, data);
    }

    // ── Comentários de fluxo ────────────────────────────────────────────────

    findAllComentarios(): Promise<UfFluxoComentario[]> {
        return this.comentarioRepo.find({ order: { createdAt: "DESC" } });
    }

    findComentariosByUf(ufId: number): Promise<UfFluxoComentario[]> {
        return this.comentarioRepo.find({ where: { ufId }, order: { createdAt: "DESC" } });
    }

    async createComentario(ufId: number, texto: string, autor: string): Promise<UfFluxoComentario> {
        await this.findById(ufId); // garante que a UF existe
        const comentario = this.comentarioRepo.create({ ufId, texto, autor });
        return this.comentarioRepo.save(comentario);
    }

    async deleteComentario(id: number): Promise<void> {
        const item = await this.comentarioRepo.findOne({ where: { id } });
        if (!item) throw new NotFoundException(`Comentário ${id} não encontrado`);
        await this.comentarioRepo.remove(item);
    }
}
