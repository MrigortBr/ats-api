import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUfDto {
    @ApiPropertyOptional({ example: "ESTADO" })
    agreement?: string | null;

    @ApiPropertyOptional({ enum: ["Sim", "Nao", "Em andamento"] })
    cib?: string | null;
}
