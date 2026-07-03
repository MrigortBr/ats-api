import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { GeneralQuota } from "./entities/general-quota.entity";
import { GeneralQuotaService } from "./general-quota.service";
import { GeneralQuotaRepository } from "./general-quota.repository";

@Module({
    imports: [TypeOrmModule.forFeature([GeneralQuota])],
    providers: [GeneralQuotaService, GeneralQuotaRepository, Reflector],
    exports: [GeneralQuotaService, GeneralQuotaRepository],
})
export class GeneralQuotaModule {}
