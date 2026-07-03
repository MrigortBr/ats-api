import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class TransportTrsDto {
    @ApiProperty() @IsInt() ufId!: number;
    @ApiProperty({ default: 0 }) @IsNumber() van!: number;
    @ApiProperty({ default: 0 }) @IsNumber() microbus!: number;
    @ApiPropertyOptional() @IsOptional() @IsString() observation?: string | null;
}

export class UpdateTransportTrsDto extends PartialType(TransportTrsDto) {}
