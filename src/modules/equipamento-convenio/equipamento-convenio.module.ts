import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { EquipamentoConvenioSisconv } from "./entities/equipamento-convenio-sisconv.entity";
import { EquipamentoConvenioSispro } from "./entities/equipamento-convenio-sispro.entity";
import { EquipamentoConvenioService } from "./equipamento-convenio.service";
import { EquipamentoConvenioController } from "./equipamento-convenio.controller";

@Module({
    imports: [TypeOrmModule.forFeature([EquipamentoConvenioSisconv, EquipamentoConvenioSispro])],
    controllers: [EquipamentoConvenioController],
    providers: [EquipamentoConvenioService, Reflector],
    exports: [EquipamentoConvenioService],
})
export class EquipamentoConvenioModule {}
