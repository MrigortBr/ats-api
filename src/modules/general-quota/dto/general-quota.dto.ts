import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsInt, IsNumber } from "class-validator";

export class GeneralQuotaDto {
    @ApiProperty() @IsInt() ufId!: number;
    @ApiProperty({ default: 0 }) @IsNumber() van!: number;
    @ApiProperty({ default: 0 }) @IsNumber() ambulance!: number;
    @ApiProperty({ default: 0 }) @IsNumber() microbus!: number;
}

export class UpdateGeneralQuotaDto extends PartialType(GeneralQuotaDto) {}
