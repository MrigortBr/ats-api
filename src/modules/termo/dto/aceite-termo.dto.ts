import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayMaxSize,
    IsArray,
    IsDefined,
    IsIn,
    IsInt,
    IsISO8601,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from "class-validator";

export const TIPOS_DISPOSITIVO = ["desktop", "mobile", "tablet", "desconhecido"] as const;
export const STATUS_LOCALIZACAO = ["concedida", "negada", "indisponivel", "tempo_esgotado", "erro"] as const;

/** Dados do navegador/dispositivo coletados no frontend. */
export class ClienteInfoDto {
    @ApiPropertyOptional({ example: "Chrome" })
    @IsOptional() @IsString() @MaxLength(60)
    navegador?: string;

    @ApiPropertyOptional({ example: "129.0.6668.90" })
    @IsOptional() @IsString() @MaxLength(40)
    navegadorVersao?: string;

    @ApiPropertyOptional({ example: "Windows 10/11" })
    @IsOptional() @IsString() @MaxLength(60)
    sistemaOperacional?: string;

    @ApiPropertyOptional({ enum: TIPOS_DISPOSITIVO })
    @IsOptional() @IsIn(TIPOS_DISPOSITIVO)
    tipoDispositivo?: (typeof TIPOS_DISPOSITIVO)[number];

    @ApiPropertyOptional({ example: "pt-BR" })
    @IsOptional() @IsString() @MaxLength(35)
    idioma?: string;

    @ApiPropertyOptional({ example: ["pt-BR", "en-US"] })
    @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(35, { each: true })
    idiomas?: string[];

    @ApiPropertyOptional({ example: "America/Sao_Paulo" })
    @IsOptional() @IsString() @MaxLength(64)
    fusoHorario?: string;

    /** Offset do relogio do cliente em minutos (ex.: -180 para UTC-03:00). */
    @ApiPropertyOptional({ example: -180 })
    @IsOptional() @IsInt() @Min(-840) @Max(840)
    offsetMinutos?: number;

    @ApiPropertyOptional({ example: "1920x1080" })
    @IsOptional() @IsString() @MaxLength(20)
    resolucaoTela?: string;

    @ApiPropertyOptional({ example: 1.25 })
    @IsOptional() @IsNumber() @Min(0) @Max(20)
    pixelRatio?: number;
}

/** Localizacao precisa do navegador (somente com permissao do usuario). */
export class LocalizacaoDto {
    @ApiProperty({ enum: STATUS_LOCALIZACAO })
    @IsIn(STATUS_LOCALIZACAO)
    status!: (typeof STATUS_LOCALIZACAO)[number];

    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(-90) @Max(90)
    latitude?: number;

    @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(-180) @Max(180)
    longitude?: number;

    @ApiPropertyOptional({ description: "Precisao em metros" })
    @IsOptional() @IsNumber() @Min(0) @Max(10_000_000)
    precisaoMetros?: number;
}

/** Aceite do termo enviado junto com o login. */
export class AceiteTermoDto {
    @ApiProperty({ example: "1.0" })
    @IsString() @IsNotEmpty() @MaxLength(20)
    versao!: string;

    /**
     * Momento em que o usuario marcou o checkbox, no relogio do navegador,
     * em ISO 8601 com fuso (ex.: 2026-10-01T08:51:37.214-03:00).
     * O horario oficial da assinatura e o do servidor; este fica como referencia.
     */
    @ApiProperty({ example: "2026-10-01T08:51:37.214-03:00" })
    @IsISO8601({ strict: true }) @MaxLength(40)
    assinadoEm!: string;

    @ApiProperty({ type: ClienteInfoDto })
    @IsDefined() @ValidateNested() @Type(() => ClienteInfoDto)
    cliente!: ClienteInfoDto;

    @ApiProperty({ type: LocalizacaoDto })
    @IsDefined() @ValidateNested() @Type(() => LocalizacaoDto)
    localizacao!: LocalizacaoDto;
}
