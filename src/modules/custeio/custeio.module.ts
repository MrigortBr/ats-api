import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CusteioController } from "./custeio.controller";
import { CusteioService } from "./custeio.service";
import { CusteioResponsavel } from "./entities/custeio-responsavel.entity";
import { CusteioAtendido } from "./entities/custeio-atendido.entity";
import { CusteioMunicipioRef } from "./entities/custeio-municipio-ref.entity";
import { CusteioDistanciaCache } from "./entities/custeio-distancia-cache.entity";
import { CusteioProjecao } from "./entities/custeio-projecao.entity";
import { DistanciaService } from "./distancia.service";

@Module({
    imports: [TypeOrmModule.forFeature([CusteioResponsavel, CusteioAtendido, CusteioMunicipioRef, CusteioDistanciaCache, CusteioProjecao])],
    controllers: [CusteioController],
    providers: [CusteioService, DistanciaService, Reflector],
})
export class CusteioModule {}
