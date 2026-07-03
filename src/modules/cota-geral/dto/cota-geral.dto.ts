import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UpdateCotaGeralQuotaDto {
    @ApiPropertyOptional() @IsOptional() @IsNumber() van?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() ambulance?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() microbus?: number;
}

export class UpdateCotaGeralDto {
    @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => UpdateCotaGeralQuotaDto) generalQuota?: UpdateCotaGeralQuotaDto;
    @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => UpdateCotaGeralQuotaDto) deliveredGeneralQuota?: UpdateCotaGeralQuotaDto;
}
