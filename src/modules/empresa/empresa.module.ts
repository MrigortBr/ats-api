import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailModule } from "../email/email.module";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";
import { Hospital } from "../hospital/entities/hospital.entity";
import { Company } from "../company/entities/company.entity";
import { Users } from "../auth/entities/user.entity";
import { Role } from "../role/entities/role.entity";
import { EmpresaProblem } from "./entities/empresa-problem.entity";
import { EmpresaService } from "./empresa.service";
import { EmpresaLockService } from "./empresa-lock.service";
import { EmpresaProblemService } from "./empresa-problem.service";
import { EmpresaPainelService } from "./empresa-painel.service";
import { EmpresaController } from "./empresa.controller";
import { EmpresaAdminService } from "./empresa-admin.service";
import { EmpresaAdminController } from "./empresa-admin.controller";

@Module({
    imports: [
        EmailModule,
        TypeOrmModule.forFeature([
            ComboConsult,
            Hospital,
            Company,
            EmpresaProblem,
            Users,
            Role,
        ]),
    ],
    providers: [EmpresaService, EmpresaLockService, EmpresaProblemService, EmpresaPainelService, EmpresaAdminService],
    controllers: [EmpresaController, EmpresaAdminController],
})
export class EmpresaModule {}
