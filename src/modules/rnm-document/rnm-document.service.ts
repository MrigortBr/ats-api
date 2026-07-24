import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RnmDocument } from "./entities/rnm-document.entity";
import { ByteaDocumentService } from "../../common/services/bytea-document.service";

@Injectable()
export class RnmDocumentService extends ByteaDocumentService<RnmDocument> {
    constructor(
        @InjectRepository(RnmDocument)
        repo: Repository<RnmDocument>,
    ) {
        super(repo, "RNM");
    }
}
