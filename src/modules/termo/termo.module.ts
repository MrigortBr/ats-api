import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TermoAceite } from "./entities/termo-aceite.entity";
import { TermoAceiteService } from "./termo-aceite.service";

/** Registro de assinatura do Termo de Uso (auditoria.termo_aceites). */
@Module({
    imports:   [TypeOrmModule.forFeature([TermoAceite])],
    providers: [TermoAceiteService],
    exports:   [TermoAceiteService],
})
export class TermoModule {}
