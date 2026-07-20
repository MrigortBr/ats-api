import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./modules/redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
// Entity modules
import { UfModule } from "./modules/uf/uf.module";
import { TransportRtxModule } from "./modules/transport-rtx/transport-rtx.module";
import { TransportTrsModule } from "./modules/transport-trs/transport-trs.module";
import { GeneralQuotaModule } from "./modules/general-quota/general-quota.module";
import { DeliveredRtxTrsModule } from "./modules/delivered-rtx-trs/delivered-rtx-trs.module";
import { DeliveredGeneralQuotaModule } from "./modules/delivered-general-quota/delivered-general-quota.module";
import { TransportValueModule } from "./modules/transport-value/transport-value.module";
// View modules
import { DistribuicaoModule } from "./modules/distribuicao/distribuicao.module";
import { EntregaModule } from "./modules/entrega/entrega.module";
import { CotaGeralModule } from "./modules/cota-geral/cota-geral.module";
import { ConsolidadoModule } from "./modules/consolidado/consolidado.module";
import { HospitalModule } from "./modules/hospital/hospital.module";
import { CibModule } from "./modules/cib/cib.module";
import { RnmDocumentModule } from "./modules/rnm-document/rnm-document.module";
import { CotaGeralMunicipioModule } from "./modules/cota-geral-municipio/cota-geral-municipio.module";
import { CompanyModule } from "./modules/company/company.module";
import { RoleModule } from "./modules/role/role.module";
import { EmpresaModule } from "./modules/empresa/empresa.module";
import { DocumentModule } from "./modules/document/document.module";
import { TomoDocumentModule } from "./modules/tomo-document/tomo-document.module";

@Module({
    controllers: [AppController],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
    imports: [
        ThrottlerModule.forRoot([{ name: "global", ttl: 60_000, limit: 300 }]),
        ScheduleModule.forRoot(),
        DatabaseModule,
        RedisModule,
        AuthModule,
        // Entity modules
        UfModule,
        TransportRtxModule,
        TransportTrsModule,
        GeneralQuotaModule,
        DeliveredRtxTrsModule,
        DeliveredGeneralQuotaModule,
        TransportValueModule,
        // View modules
        DistribuicaoModule,
        EntregaModule,
        CotaGeralModule,
        ConsolidadoModule,
        // TOMO/RNM
        HospitalModule,
        // CIB
        CibModule,
        // RNM Documents
        RnmDocumentModule,
        // Cota Geral - Municipios
        CotaGeralMunicipioModule,
        // RBAC / Multi-tenant
        CompanyModule,
        RoleModule,
        // Empresa
        EmpresaModule,
        // Documents (upload/download por módulo)
        DocumentModule,
        TomoDocumentModule,
    ],
})
export class AppModule {}
