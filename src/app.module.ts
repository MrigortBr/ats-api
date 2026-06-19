import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DatabaseModule } from "./database/database.module";
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

@Module({
    controllers: [AppController],
    imports: [
        DatabaseModule,
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
    ],
})
export class AppModule {}
