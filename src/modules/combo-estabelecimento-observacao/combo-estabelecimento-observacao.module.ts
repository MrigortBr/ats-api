import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { ComboEstabelecimentoObservacao } from "./entities/combo-estabelecimento-observacao.entity";
import { ComboEstabelecimentoObservacaoService } from "./combo-estabelecimento-observacao.service";
import { ComboEstabelecimentoObservacaoController } from "./combo-estabelecimento-observacao.controller";

@Module({
    imports: [TypeOrmModule.forFeature([ComboEstabelecimentoObservacao])],
    controllers: [ComboEstabelecimentoObservacaoController],
    providers: [ComboEstabelecimentoObservacaoService, Reflector],
    exports: [ComboEstabelecimentoObservacaoService],
})
export class ComboEstabelecimentoObservacaoModule {}
