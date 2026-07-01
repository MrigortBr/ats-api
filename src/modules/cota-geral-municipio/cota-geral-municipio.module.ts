import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CotaGeralMunicipio } from "./entities/cota-geral-municipio.entity";
import { CotaGeralMunicipioService } from "./cota-geral-municipio.service";
import { CotaGeralMunicipioController } from "./cota-geral-municipio.controller";

@Module({
    imports: [TypeOrmModule.forFeature([CotaGeralMunicipio])],
    providers: [CotaGeralMunicipioService],
    controllers: [CotaGeralMunicipioController],
    exports: [CotaGeralMunicipioService],
})
export class CotaGeralMunicipioModule {}
