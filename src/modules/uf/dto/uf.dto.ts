import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateUfDto {
    @ApiPropertyOptional({ example: "ESTADO" })
    @IsOptional() @IsString()
    agreement?: string | null;

    @ApiPropertyOptional({ enum: ["Sim", "Nao", "Em andamento"] })
    @IsOptional() @IsIn(["Sim", "Nao", "Em andamento"])
    cib?: string | null;
}
