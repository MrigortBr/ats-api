import { ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    ValidateIf,
} from "class-validator";

export class UpdateCibMunicipioDto {
    // Coluna NOT NULL: se vier, nao pode ser nulo nem vazio.
    @ApiPropertyOptional()
    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    nomeMunicipio?: string;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    regiaoSaude?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    radioterapia?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    trsHemodialise?: boolean;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    veiculos?: string | null;

    @ApiPropertyOptional({ nullable: true, description: "Codigo IBGE do municipio (7 digitos)" })
    @IsOptional()
    @Matches(/^\d{7}$/, { message: "ibge deve ter exatamente 7 digitos" })
    ibge?: string | null;
}
