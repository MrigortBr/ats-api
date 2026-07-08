import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ComboEquipamento } from "../hospital/entities/combo-equipamento.entity";
import { HospitalCombo } from "../hospital/entities/hospital-combo.entity";
import { Hospital } from "../hospital/entities/hospital.entity";
import { Company } from "../company/entities/company.entity";
import { EmpresaProblem } from "./entities/empresa-problem.entity";
import { EmpresaService } from "./empresa.service";
import { EmpresaController } from "./empresa.controller";

@Module({
    imports: [TypeOrmModule.forFeature([ComboEquipamento, HospitalCombo, Hospital, Company, EmpresaProblem])],
    providers: [EmpresaService],
    controllers: [EmpresaController],
})
export class EmpresaModule {}
