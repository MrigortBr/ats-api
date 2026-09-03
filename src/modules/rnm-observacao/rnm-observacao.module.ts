import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { RnmObservacao } from "./entities/rnm-observacao.entity";
import { RnmObservacaoImagem } from "./entities/rnm-observacao-imagem.entity";
import { RnmObservacaoService } from "./rnm-observacao.service";
import { RnmObservacaoController } from "./rnm-observacao.controller";

@Module({
    imports: [TypeOrmModule.forFeature([RnmObservacao, RnmObservacaoImagem])],
    controllers: [RnmObservacaoController],
    providers: [RnmObservacaoService, Reflector],
    exports: [RnmObservacaoService],
})
export class RnmObservacaoModule {}
