import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TomoDocument } from "./entities/tomo-document.entity";
import { TomoDocumentService } from "./tomo-document.service";
import { TomoDocumentController } from "./tomo-document.controller";

@Module({
    imports: [TypeOrmModule.forFeature([TomoDocument])],
    providers: [TomoDocumentService],
    controllers: [TomoDocumentController],
})
export class TomoDocumentModule {}
