import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UpdateDistribuicaoRtxDto {
    @ApiPropertyOptional() @IsOptional() @IsNumber() van?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() ambulance?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() minibus?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() observation?: string | null;
}

export class UpdateDistribuicaoTrsDto {
    @ApiPropertyOptional() @IsOptional() @IsNumber() van?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() microbus?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() observation?: string | null;
}

export class UpdateDistribuicaoDto {
    @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => UpdateDistribuicaoRtxDto) rtx?: UpdateDistribuicaoRtxDto;
    @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => UpdateDistribuicaoTrsDto) trs?: UpdateDistribuicaoTrsDto;
}
