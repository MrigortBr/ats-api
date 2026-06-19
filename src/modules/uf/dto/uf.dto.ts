import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUfDto {
    @ApiPropertyOptional({ example: "ESTADO" })
    agreement?: string;

    @ApiPropertyOptional({ enum: ["Sim", "Nao", "Em andamento"] })
    cib?: string;
}
