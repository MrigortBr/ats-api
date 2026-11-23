import { Module } from "@nestjs/common";
import { AparelhosDecanController } from "./aparelhos-decan.controller";
import { AparelhosDecanService } from "./aparelhos-decan.service";

@Module({
    controllers: [AparelhosDecanController],
    providers: [AparelhosDecanService],
})
export class AparelhosDecanModule {}
