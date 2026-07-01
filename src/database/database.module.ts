import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { configDotenv } from "dotenv";
import { Users } from "../modules/auth/entities/user.entity";
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
import { CibDocument } from "../modules/cib/entities/cib-document.entity";
import { RnmDocument } from "../modules/rnm-document/entities/rnm-document.entity";
import { CotaGeralMunicipio } from "../modules/cota-geral-municipio/entities/cota-geral-municipio.entity";

configDotenv();

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: String(process.env.DB_USERNAME),
            password: String(process.env.DB_PASSWORD),
            database: process.env.DB_DATABASE,
            schema: "public",
            entities: [Users, Uf, TransportRtx, TransportTrs, GeneralQuota, DeliveredRtxTrs, DeliveredGeneralQuota, TransportValue, Hospital, HospitalTomo, HospitalRnm, HospitalCombo, CibDocument, RnmDocument, CotaGeralMunicipio],
            synchronize: false,
            migrations: ["dist/database/migrations/*.js"],
        }),
    ],
})
export class DatabaseModule {}
