import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { HospitalController } from "./hospital.controller";
import { HospitalService } from "./hospital.service";
import { Hospital } from "./entities/hospital.entity";
import { HospitalTomo } from "./entities/hospital-tomo.entity";
import { HospitalRnm } from "./entities/hospital-rnm.entity";
import { HospitalCombo } from "./entities/hospital-combo.entity";
import { Uf } from "../uf/entities/uf.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Hospital, HospitalTomo, HospitalRnm, HospitalCombo, Uf])],
    controllers: [HospitalController],
    providers: [HospitalService, Reflector],
    exports: [HospitalService],
})
export class HospitalModule {}
