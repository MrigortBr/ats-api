import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { ProducaoComboMensal } from "./entities/producao-combo-mensal.entity";
import { ComboProducaoService } from "./combo-producao.service";
import { ComboProducaoController } from "./combo-producao.controller";

@Module({
    imports: [TypeOrmModule.forFeature([ProducaoComboMensal])],
    controllers: [ComboProducaoController],
    providers: [ComboProducaoService, Reflector],
})
export class ComboProducaoModule {}
