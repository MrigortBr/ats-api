import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CibMunicipio } from "./entities/cib-municipio.entity";
import { CibMunicipioService } from "./cib-municipio.service";
import { CibMunicipioController } from "./cib-municipio.controller";

@Module({
    imports: [TypeOrmModule.forFeature([CibMunicipio])],
    providers: [CibMunicipioService],
    controllers: [CibMunicipioController],
    exports: [CibMunicipioService],
})
export class CibMunicipioModule {}
