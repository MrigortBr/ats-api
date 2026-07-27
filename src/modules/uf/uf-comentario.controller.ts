import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import type { AuthRequest } from "../../common/types/auth-request.type";
import { UfService } from "./uf.service";
import { CreateFluxoComentarioDto } from "./dto/create-fluxo-comentario.dto";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@Controller("/uf-comentarios")
export class UfComentarioController {
    constructor(private readonly service: UfService) {}

    /** Todos os comentários — para enriquecer a listagem do frontend de uma vez */
    @Get()
    findAll() {
        return this.service.findAllComentarios();
    }

    /** Comentários de uma UF específica */
    @Get("by-uf/:ufId")
    findByUf(@Param("ufId") ufId: string) {
        return this.service.findComentariosByUf(Number(ufId));
    }

    /** Criar comentário */
    @Post(":ufId")
    create(
        @Param("ufId") ufId: string,
        @Body() dto: CreateFluxoComentarioDto,
        @Req() req: AuthRequest,
    ) {
        const autor = req.user?.name ?? req.user?.email ?? "Usuário";
        return this.service.createComentario(Number(ufId), dto.texto, String(autor), dto.url);
    }

    /** Excluir comentário */
    @Delete(":id")
    async delete(@Param("id") id: string) {
        await this.service.deleteComentario(Number(id));
        return { message: "Comentário removido com sucesso" };
    }
}
