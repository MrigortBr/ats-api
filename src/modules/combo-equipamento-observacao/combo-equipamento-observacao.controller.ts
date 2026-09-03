import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import type { AuthRequest } from "../../common/types/auth-request.type";
import { ComboEquipamentoObservacaoService } from "./combo-equipamento-observacao.service";
import { CreateComboEquipamentoObservacaoDto } from "./dto/create-combo-equipamento-observacao.dto";

@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("combo")
@Controller("/combo-equipamento-observacoes")
export class ComboEquipamentoObservacaoController {
    constructor(private readonly service: ComboEquipamentoObservacaoService) {}

    /** Todas as observações — para enriquecer a listagem do frontend de uma vez */
    @Get()
    findAll() {
        return this.service.findAll();
    }

    /** Observações de um equipamento específico (equipKey) */
    @Get("by-equip-key/:equipKey")
    findByEquipKey(@Param("equipKey") equipKey: string) {
        return this.service.findByEquipKey(equipKey);
    }

    /** Criar observação — o autor vem do usuário autenticado (auditoria) */
    @Post(":equipKey")
    create(
        @Param("equipKey") equipKey: string,
        @Body() dto: CreateComboEquipamentoObservacaoDto,
        @Req() req: AuthRequest,
    ) {
        const autor = req.user?.name ?? req.user?.email ?? "Usuário";
        return this.service.create(equipKey, dto.texto, String(autor));
    }

    /** Excluir observação — restrito a administradores (auditoria não pode ser apagada por qualquer um) */
    @Delete(":id")
    @RequiresModule("admin")
    async delete(@Param("id") id: string) {
        await this.service.delete(Number(id));
        return { message: "Observação removida com sucesso" };
    }
}
