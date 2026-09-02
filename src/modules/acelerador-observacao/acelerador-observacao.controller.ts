import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import type { AuthRequest } from "../../common/types/auth-request.type";
import { AceleradorObservacaoService } from "./acelerador-observacao.service";
import { CreateAceleradorObservacaoDto } from "./dto/create-acelerador-observacao.dto";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("tomo")
@Controller("/acelerador-observacoes")
export class AceleradorObservacaoController {
    constructor(private readonly service: AceleradorObservacaoService) {}

    /** Todas as observações — para enriquecer a listagem do frontend de uma vez */
    @Get()
    findAll() {
        return this.service.findAll();
    }

    /** Observações de um estabelecimento específico */
    @Get("by-cnes/:cnes")
    findByCnes(@Param("cnes") cnes: string) {
        return this.service.findByCnes(cnes);
    }

    /** Criar observação — o autor vem do usuário autenticado (auditoria) */
    @Post(":cnes")
    create(
        @Param("cnes") cnes: string,
        @Body() dto: CreateAceleradorObservacaoDto,
        @Req() req: AuthRequest,
    ) {
        const autor = req.user?.name ?? req.user?.email ?? "Usuário";
        return this.service.create(cnes, dto.texto, String(autor));
    }

    /** Excluir observação — restrito a administradores (auditoria não pode ser apagada por qualquer um) */
    @Delete(":id")
    @RequiresModule("admin")
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "Observação removida com sucesso" };
    }
}
