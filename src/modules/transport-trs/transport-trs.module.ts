import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { TransportTrs } from "./entities/transport-trs.entity";
import { TransportTrsService } from "./transport-trs.service";
import { TransportTrsRepository } from "./transport-trs.repository";

@Module({
    imports: [TypeOrmModule.forFeature([TransportTrs])],
    providers: [TransportTrsService, TransportTrsRepository, Reflector],
    exports: [TransportTrsService, TransportTrsRepository],
})
export class TransportTrsModule {}
