import { IsEnum, IsInt, IsOptional, IsPositive } from "class-validator";
import { Type } from "class-transformer";
import type { DocumentType } from "../document-types";
import { ALL_DOCUMENT_TYPES } from "../document-types";

export class UploadDocumentDto {
    @IsEnum(ALL_DOCUMENT_TYPES)
    documentType!: DocumentType;

    /** Para endpoints de combo — o ID do ComboConsult. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    consultId?: number;

    /** Para endpoints de tomo. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    tomoId?: number;

    /** Para endpoints de rnm. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    rnmId?: number;
}

export class FindDocumentsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    consultId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    tomoId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    rnmId?: number;
}
