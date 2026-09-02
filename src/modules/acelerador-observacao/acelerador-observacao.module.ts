import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { AceleradorObservacao } from "./entities/acelerador-observacao.entity";
import { AceleradorObservacaoService } from "./acelerador-observacao.service";
import { AceleradorObservacaoController } from "./acelerador-observacao.controller";

@Module({
    imports: [TypeOrmModule.forFeature([AceleradorObservacao])],
    controllers: [AceleradorObservacaoController],
    providers: [AceleradorObservacaoService, Reflector],
    exports: [AceleradorObservacaoService],
})
export class AceleradorObservacaoModule {}
