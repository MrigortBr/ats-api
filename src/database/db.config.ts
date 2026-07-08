import { configDotenv } from "dotenv";
import { Users } from "../modules/auth/entities/user.entity";
import { Company } from "../modules/company/entities/company.entity";
import { Role } from "../modules/role/entities/role.entity";
import { RoleModule as RoleModuleEntity } from "../modules/role/entities/role-module.entity";
import { Uf } from "../modules/uf/entities/uf.entity";
import { TransportRtx } from "../modules/transport-rtx/entities/transport-rtx.entity";
import { TransportTrs } from "../modules/transport-trs/entities/transport-trs.entity";
import { GeneralQuota } from "../modules/general-quota/entities/general-quota.entity";
import { DeliveredRtxTrs } from "../modules/delivered-rtx-trs/entities/delivered-rtx-trs.entity";
import { DeliveredGeneralQuota } from "../modules/delivered-general-quota/entities/delivered-general-quota.entity";
import { TransportValue } from "../modules/transport-value/entities/transport-value.entity";
import { Hospital } from "../modules/hospital/entities/hospital.entity";
import { HospitalTomo } from "../modules/hospital/entities/hospital-tomo.entity";
import { HospitalRnm } from "../modules/hospital/entities/hospital-rnm.entity";
import { HospitalCombo } from "../modules/hospital/entities/hospital-combo.entity";
import { ComboEquipamento } from "../modules/hospital/entities/combo-equipamento.entity";
import { CibDocument } from "../modules/cib/entities/cib-document.entity";
import { RnmDocument } from "../modules/rnm-document/entities/rnm-document.entity";
import { CotaGeralMunicipio } from "../modules/cota-geral-municipio/entities/cota-geral-municipio.entity";
import { EmpresaProblem } from "../modules/empresa/entities/empresa-problem.entity";

configDotenv();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DB_ENTITIES: any[] = [
    Users, Company, Role, RoleModuleEntity,
    Uf, TransportRtx, TransportTrs, GeneralQuota,
    DeliveredRtxTrs, DeliveredGeneralQuota, TransportValue,
    Hospital, HospitalTomo, HospitalRnm, HospitalCombo, ComboEquipamento,
    CibDocument, RnmDocument, CotaGeralMunicipio,
    EmpresaProblem,
];

export const DB_BASE_OPTIONS = {
    type: "postgres" as const,
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    username: String(process.env.DB_USERNAME),
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_DATABASE,
    schema:   "public",
    entities: DB_ENTITIES,
};
