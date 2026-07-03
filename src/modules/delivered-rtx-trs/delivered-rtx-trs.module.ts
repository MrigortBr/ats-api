import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { DeliveredRtxTrs } from "./entities/delivered-rtx-trs.entity";
import { DeliveredRtxTrsRepository } from "./delivered-rtx-trs.repository";
import { DeliveredRtxTrsService } from "./delivered-rtx-trs.service";

@Module({
    imports: [TypeOrmModule.forFeature([DeliveredRtxTrs])],
    providers: [DeliveredRtxTrsService, DeliveredRtxTrsRepository, Reflector],
    exports: [DeliveredRtxTrsRepository],
})
export class DeliveredRtxTrsModule {}
