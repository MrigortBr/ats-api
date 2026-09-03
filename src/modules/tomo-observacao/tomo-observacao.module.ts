import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { TomoObservacao } from "./entities/tomo-observacao.entity";
import { TomoObservacaoImagem } from "./entities/tomo-observacao-imagem.entity";
import { TomoObservacaoService } from "./tomo-observacao.service";
import { TomoObservacaoController } from "./tomo-observacao.controller";

@Module({
    imports: [TypeOrmModule.forFeature([TomoObservacao, TomoObservacaoImagem])],
    controllers: [TomoObservacaoController],
    providers: [TomoObservacaoService, Reflector],
    exports: [TomoObservacaoService],
})
export class TomoObservacaoModule {}
