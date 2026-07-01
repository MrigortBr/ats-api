import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CotaGeralController } from "./cota-geral.controller";
import { CotaGeralService } from "./cota-geral.service";
import { DeliveredGeneralQuotaModule } from "../delivered-general-quota/delivered-general-quota.module";
import { UfModule } from "../uf/uf.module";

@Module({
    imports: [DeliveredGeneralQuotaModule, UfModule],
    controllers: [CotaGeralController],
    providers: [CotaGeralService, Reflector],
})
export class CotaGeralModule {}
