import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RnmDocument } from "./entities/rnm-document.entity";
import { RnmDocumentService } from "./rnm-document.service";
import { RnmDocumentController } from "./rnm-document.controller";

@Module({
    imports: [TypeOrmModule.forFeature([RnmDocument])],
    providers: [RnmDocumentService],
    controllers: [RnmDocumentController],
})
export class RnmDocumentModule {}
