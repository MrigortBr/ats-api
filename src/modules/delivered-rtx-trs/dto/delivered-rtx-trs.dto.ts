import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class UpdateDeliveredRtxTrsDto {
    @ApiPropertyOptional() @IsOptional() @IsNumber() van?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() ambulance?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() minibus?: number;
}
