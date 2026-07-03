import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { Uf } from "./entities/uf.entity";
import { UfService } from "./uf.service";
import { UfRepository } from "./uf.repository";

@Module({
    imports: [TypeOrmModule.forFeature([Uf])],
    providers: [UfService, UfRepository, Reflector],
    exports: [UfService, UfRepository],
})
export class UfModule {}
