import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TomoDocument } from "./entities/tomo-document.entity";
import { ByteaDocumentService } from "../../common/services/bytea-document.service";

@Injectable()
export class TomoDocumentService extends ByteaDocumentService<TomoDocument> {
    constructor(
        @InjectRepository(TomoDocument)
        repo: Repository<TomoDocument>,
    ) {
        super(repo, "TOMO");
    }
}
