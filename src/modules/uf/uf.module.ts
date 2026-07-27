import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { Uf } from "./entities/uf.entity";
import { UfFluxoComentario } from "./entities/uf-fluxo-comentario.entity";
import { UfService } from "./uf.service";
import { UfRepository } from "./uf.repository";
import { UfController } from "./uf.controller";
import { UfComentarioController } from "./uf-comentario.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Uf, UfFluxoComentario])],
    controllers: [UfController, UfComentarioController],
    providers: [UfService, UfRepository, Reflector],
    exports: [UfService, UfRepository],
})
export class UfModule {}
