import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { Uf } from "./entities/uf.entity";
import { UfService } from "./uf.service";
import { UfRepository } from "./uf.repository";
import { UfController } from "./uf.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Uf])],
    controllers: [UfController],
    providers: [UfService, UfRepository, Reflector],
    exports: [UfService, UfRepository],
})
export class UfModule {}
