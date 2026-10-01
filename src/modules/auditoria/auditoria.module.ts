import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditoriaEvento } from "./entities/auditoria-evento.entity";
import { TermoAceite } from "../termo/entities/termo-aceite.entity";
import { Users } from "../auth/entities/user.entity";
import { AuditoriaEventosService } from "./auditoria-eventos.service";
import { AuditoriaConsultaService } from "./auditoria-consulta.service";
import { AuditoriaController } from "./auditoria.controller";
import { AuditoriaAlteracao } from "./entities/auditoria-alteracao.entity";
import { AuditoriaAlteracoesService } from "./dados/auditoria-alteracoes.service";
import { AuditoriaDadosSubscriber } from "./dados/auditoria-dados.subscriber";
import { AuditoriaDadosInterceptor } from "./dados/auditoria-dados.interceptor";

/**
 * Trilha de auditoria (schema "auditoria"): eventos de acesso, alteracoes e
 * downloads de dados, e consulta restrita a administradores. Nao importa o AuthModule (evita ciclo) —
 * o AuthModule e quem importa este modulo para registrar login/logout.
 */
@Module({
    imports:     [TypeOrmModule.forFeature([AuditoriaEvento, AuditoriaAlteracao, TermoAceite, Users])],
    controllers: [AuditoriaController],
    providers:   [
        AuditoriaEventosService,
        AuditoriaConsultaService,
        AuditoriaAlteracoesService,
        AuditoriaDadosSubscriber,
        // Audita escritas e downloads de todos os modulos de negocio.
        { provide: APP_INTERCEPTOR, useClass: AuditoriaDadosInterceptor },
    ],
    exports:     [AuditoriaEventosService],
})
export class AuditoriaModule {}
