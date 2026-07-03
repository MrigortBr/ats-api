import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { DeliveredGeneralQuota } from "./entities/delivered-general-quota.entity";
import { DeliveredGeneralQuotaService } from "./delivered-general-quota.service";
import { DeliveredGeneralQuotaRepository } from "./delivered-general-quota.repository";

@Module({
    imports: [TypeOrmModule.forFeature([DeliveredGeneralQuota])],
    providers: [DeliveredGeneralQuotaService, DeliveredGeneralQuotaRepository, Reflector],
    exports: [DeliveredGeneralQuotaService, DeliveredGeneralQuotaRepository],
})
export class DeliveredGeneralQuotaModule {}
