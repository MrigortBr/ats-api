import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AceleradoresController } from "./aceleradores.controller";
import { AceleradoresService } from "./aceleradores.service";
import { AceleradorSincronizacao } from "./entities/acelerador-sincronizacao.entity";
import { AceleradorSimdashRegistro } from "./entities/acelerador-simdash-registro.entity";

@Module({
    imports: [TypeOrmModule.forFeature([AceleradorSincronizacao, AceleradorSimdashRegistro])],
    controllers: [AceleradoresController],
    providers: [AceleradoresService],
})
export class AceleradoresModule {}
