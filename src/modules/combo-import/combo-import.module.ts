import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ComboImportController } from "./combo-import.controller";
import { ComboImportService } from "./combo-import.service";

@Module({
    controllers: [ComboImportController],
    providers: [ComboImportService, Reflector],
})
export class ComboImportModule {}
