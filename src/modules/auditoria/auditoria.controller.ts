import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import type { AuthRequest } from "../../common/types/auth-request.type";
import { extractRequestOrigin } from "../termo/request-origin";
import { AuditoriaConsultaService } from "./auditoria-consulta.service";
import { AuditoriaEventosService } from "./auditoria-eventos.service";
import { FiltrosAlteracoesDto, FiltrosAuditoriaDto, FiltrosEventosDto } from "./dto/filtros-auditoria.dto";

/**
 * Consulta a trilha de auditoria — SOMENTE administradores (modulo "admin").
 *
 * Toda consulta e verificacao e registrada na propria trilha (AUDITORIA_CONSULTA /
 * AUDITORIA_VERIFICACAO). Se o registro da consulta falhar, os dados nao sao devolvidos.
 * Respostas sem cache (ver HttpCacheInterceptor).
 */
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("admin")
@Controller("/auditoria")
export class AuditoriaController {
    constructor(
        private readonly consulta: AuditoriaConsultaService,
        private readonly eventos: AuditoriaEventosService,
    ) {}

    private async registrarConsulta(req: AuthRequest, recurso: string, filtros: object, tipo: "AUDITORIA_CONSULTA" | "AUDITORIA_VERIFICACAO" = "AUDITORIA_CONSULTA") {
        await this.eventos.registrar({
            tipo,
            usuario: req.user ? { id: req.user.id, email: req.user.email } : null,
            detalhes: { origem: extractRequestOrigin(req), filtros: { recurso, ...filtros } },
        });
    }

    /** Contadores das ultimas 24h e totais (nao registra consulta — dados agregados). */
    @Get("resumo")
    resumo() {
        return this.consulta.resumo();
    }

    /** Assinaturas do termo (cada login bem-sucedido), com dados de acesso decifrados. */
    @Get("aceites")
    async aceites(@Query() filtros: FiltrosAuditoriaDto, @Req() req: AuthRequest) {
        await this.registrarConsulta(req, "aceites", filtros);
        return this.consulta.listarAceites(filtros);
    }

    /** Eventos: logins, falhas, logouts e consultas a auditoria. */
    @Get("eventos")
    async listarEventos(@Query() filtros: FiltrosEventosDto, @Req() req: AuthRequest) {
        await this.registrarConsulta(req, "eventos", filtros);
        return this.consulta.listarEventos(filtros);
    }

    /** Alteracoes e downloads de dados (transporte, equipamentos, empresa, administracao). */
    @Get("alteracoes")
    async listarAlteracoes(@Query() filtros: FiltrosAlteracoesDto, @Req() req: AuthRequest) {
        await this.registrarConsulta(req, "alteracoes", filtros);
        return this.consulta.listarAlteracoes(filtros);
    }

    /** Recalcula as cadeias de hash e confere o conteudo cifrado. */
    @Get("verificar")
    async verificar(@Req() req: AuthRequest) {
        const resultado = await this.consulta.verificar();
        await this.registrarConsulta(req, "verificar", {
            aceitesValida: resultado.aceites.valida,
            eventosValida: resultado.eventos.valida,
            alteracoesValida: resultado.alteracoes.valida,
            ultimoHashAceites: resultado.aceites.ultimoHash,
            ultimoHashEventos: resultado.eventos.ultimoHash,
            ultimoHashAlteracoes: resultado.alteracoes.ultimoHash,
        }, "AUDITORIA_VERIFICACAO");
        return resultado;
    }
}
