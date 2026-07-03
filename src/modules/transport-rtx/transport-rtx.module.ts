import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { TransportRtx } from "./entities/transport-rtx.entity";
import { TransportRtxService } from "./transport-rtx.service";
import { TransportRtxRepository } from "./transport-rtx.repository";

@Module({
    imports: [TypeOrmModule.forFeature([TransportRtx])],
    providers: [TransportRtxService, TransportRtxRepository, Reflector],
    exports: [TransportRtxService, TransportRtxRepository],
})
export class TransportRtxModule {}
