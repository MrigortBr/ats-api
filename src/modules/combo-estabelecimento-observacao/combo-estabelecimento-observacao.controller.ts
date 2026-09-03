import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import type { AuthRequest } from "../../common/types/auth-request.type";
import { ComboEstabelecimentoObservacaoService } from "./combo-estabelecimento-observacao.service";
import { CreateComboEstabelecimentoObservacaoDto } from "./dto/create-combo-estabelecimento-observacao.dto";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("combo")
@Controller("/combo-estabelecimento-observacoes")
export class ComboEstabelecimentoObservacaoController {
    constructor(private readonly service: ComboEstabelecimentoObservacaoService) {}

    /** Todas as observações — para enriquecer a listagem do frontend de uma vez */
    @Get()
    findAll() {
        return this.service.findAll();
    }

    /** Observações de um estabelecimento específico (estabKey) */
    @Get("by-estab-key/:estabKey")
    findByEstabKey(@Param("estabKey") estabKey: string) {
        return this.service.findByEstabKey(estabKey);
    }

    /** Criar observação — o autor vem do usuário autenticado (auditoria) */
    @Post(":estabKey")
    create(
        @Param("estabKey") estabKey: string,
        @Body() dto: CreateComboEstabelecimentoObservacaoDto,
        @Req() req: AuthRequest,
    ) {
        const autor = req.user?.name ?? req.user?.email ?? "Usuário";
        return this.service.create(estabKey, dto.texto, String(autor));
    }

    /** Excluir observação — restrito a administradores (auditoria não pode ser apagada por qualquer um) */
    @Delete(":id")
    @RequiresModule("admin")
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "Observação removida com sucesso" };
    }
}
