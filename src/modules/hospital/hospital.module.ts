import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { HospitalController } from "./hospital.controller";
import { HospitalService } from "./hospital.service";
import { HospitalComboService } from "./hospital-combo.service";
import { Hospital } from "./entities/hospital.entity";
import { HospitalTomo } from "./entities/hospital-tomo.entity";
import { HospitalRnm } from "./entities/hospital-rnm.entity";
import { ComboConsult } from "./entities/combo-consult.entity";
import { HospitalTipoAtendimento } from "./entities/hospital-tipo-atendimento.entity";
import { Uf } from "../uf/entities/uf.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Hospital, HospitalTomo, HospitalRnm, ComboConsult, HospitalTipoAtendimento, Uf])],
    controllers: [HospitalController],
    providers: [HospitalService, HospitalComboService, Reflector],
    exports: [HospitalService, HospitalComboService],
})
export class HospitalModule {}
