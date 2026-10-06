import { Module } from "@nestjs/common";
import { AceleradoresController } from "./aceleradores.controller";
import { AceleradoresService } from "./aceleradores.service";

@Module({
    controllers: [AceleradoresController],
    providers: [AceleradoresService],
})
export class AceleradoresModule {}
