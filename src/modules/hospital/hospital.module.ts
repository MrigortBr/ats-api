import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { HospitalController } from "./hospital.controller";
import { HospitalService } from "./hospital.service";
import { Hospital } from "./entities/hospital.entity";
import { HospitalTomo } from "./entities/hospital-tomo.entity";
import { HospitalRnm } from "./entities/hospital-rnm.entity";
import { ComboConsult } from "./entities/combo-consult.entity";
import { Uf } from "../uf/entities/uf.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Hospital, HospitalTomo, HospitalRnm, ComboConsult, Uf])],
    controllers: [HospitalController],
    providers: [HospitalService, Reflector],
    exports: [HospitalService],
})
export class HospitalModule {}
