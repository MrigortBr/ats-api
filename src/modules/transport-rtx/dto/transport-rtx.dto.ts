import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class TransportRtxDto {
    @ApiProperty() @IsInt() ufId!: number;
    @ApiProperty({ default: 0 }) @IsNumber() van!: number;
    @ApiProperty({ default: 0 }) @IsNumber() ambulance!: number;
    @ApiProperty({ default: 0 }) @IsNumber() minibus!: number;
    @ApiPropertyOptional() @IsOptional() @IsString() observation?: string | null;
}

export class UpdateTransportRtxDto extends PartialType(TransportRtxDto) {}
