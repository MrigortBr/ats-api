import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { AceiteTermoDto } from "../../termo/dto/aceite-termo.dto";

export class LoginDto {
    @ApiProperty({ example: "usuario@saude.gov.br" })
    @IsString() @IsNotEmpty()
    login!: string;

    @ApiProperty({ example: "senha123" })
    @IsString() @IsNotEmpty()
    password!: string;

    /** Aceite do Termo de Uso — obrigatorio; sem ele o login e recusado (400). */
    @ApiProperty({ type: AceiteTermoDto })
    @IsDefined({ message: "E obrigatorio aceitar o termo de uso para entrar" })
    @ValidateNested() @Type(() => AceiteTermoDto)
    aceite!: AceiteTermoDto;
}
