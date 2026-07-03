import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UpdateRtxTrsDto {
    @ApiPropertyOptional() @IsOptional() @IsNumber() van?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() ambulance?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() minibus?: number;
}

export class UpdateGeneralQuotaDto {
    @ApiPropertyOptional() @IsOptional() @IsNumber() van?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() ambulance?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() microbus?: number;
}

export class UpdateEntregaDto {
    @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => UpdateRtxTrsDto) rtxTrs?: UpdateRtxTrsDto;
    @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => UpdateGeneralQuotaDto) generalQuota?: UpdateGeneralQuotaDto;
    @ApiPropertyOptional() @IsOptional() @IsString() rtxObservation?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() trsObservation?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() cib?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() agreement?: string | null;
}
