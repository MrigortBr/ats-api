import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { ComboEquipamentoObservacao } from "./entities/combo-equipamento-observacao.entity";
import { ComboEquipamentoObservacaoService } from "./combo-equipamento-observacao.service";
import { ComboEquipamentoObservacaoController } from "./combo-equipamento-observacao.controller";

@Module({
    imports: [TypeOrmModule.forFeature([ComboEquipamentoObservacao])],
    controllers: [ComboEquipamentoObservacaoController],
    providers: [ComboEquipamentoObservacaoService, Reflector],
    exports: [ComboEquipamentoObservacaoService],
})
export class ComboEquipamentoObservacaoModule {}
