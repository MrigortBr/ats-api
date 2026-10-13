import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Length, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from "class-validator";

export class UpdateCusteioAtendidoDto {
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
    nome!: string;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(40)
    tag?: string | null;

    /** Pacientes de RT sem acompanhantes; aceita meio paciente. */
    @ApiProperty() @IsNumber({ maxDecimalPlaces: 1 }) @Min(0) @Max(1_000_000)
    rt!: number;

    @ApiProperty() @IsInt() @Min(0) @Max(1_000_000)
    hd!: number;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100_000)
    distRt?: number | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100_000)
    distHd?: number | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(20)
    faixaRt?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(20)
    faixaHd?: string | null;

    /** UF da referência quando interestadual; nulo = mesma UF. */
    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @Length(2, 2)
    refUf?: string | null;
}

export class UpdateCusteioResponsavelDto {
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
    municipio!: string;

    /** Só quando o gestor de hemodiálise é outro município. */
    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(120)
    gestorHd?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(60)
    tipoVeiculo?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(60)
    tipoVeiculoHd?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsInt() @Min(0) @Max(10_000)
    nVeiculos?: number | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refRt?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refHd?: string | null;

    @ApiProperty({ type: [UpdateCusteioAtendidoDto] })
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200)
    @ValidateNested({ each: true }) @Type(() => UpdateCusteioAtendidoDto)
    atendidos!: UpdateCusteioAtendidoDto[];
}

export class CreateCusteioAtendidoDto {
    /** Código IBGE do município atendido; os dados de RT vêm da base de referência. */
    @ApiProperty() @IsInt() @Min(1)
    codigoIbge!: number;
}

export class CreateCusteioResponsavelDto {
    @ApiProperty() @IsString() @Length(2, 2)
    uf!: string;

    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
    municipio!: string;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(120)
    gestorHd?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(60)
    tipoVeiculo?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refRt?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refHd?: string | null;

    @ApiProperty({ type: [CreateCusteioAtendidoDto] })
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200)
    @ValidateNested({ each: true }) @Type(() => CreateCusteioAtendidoDto)
    atendidos!: CreateCusteioAtendidoDto[];
}

/** Linha da planilha do UF: existente (sem codigoIbge, valores como estão) ou nova (com codigoIbge, valores da base). */
export class SyncCusteioAtendidoDto {
    /** Município novo vindo da base de referência; o servidor define nome, pacientes RT e km. */
    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
    codigoIbge?: number;

    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
    nome?: string;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(40)
    tag?: string | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber({ maxDecimalPlaces: 1 }) @Min(0) @Max(1_000_000)
    rt?: number;

    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(1_000_000)
    hd?: number;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100_000)
    distRt?: number | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100_000)
    distHd?: number | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(20)
    faixaRt?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(20)
    faixaHd?: string | null;

    /** UF da referência quando interestadual; nulo = mesma UF. */
    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @Length(2, 2)
    refUf?: string | null;
}

export class SyncCusteioResponsavelDto {
    /** Ausente = custeio novo. Os campos não enviados (gestorHd, tipoVeiculoHd, nVeiculos, divisão) são preservados. */
    @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
    id?: number;

    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
    municipio!: string;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(60)
    tipoVeiculo?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refRt?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refHd?: string | null;

    @ApiProperty({ type: [SyncCusteioAtendidoDto] })
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200)
    @ValidateNested({ each: true }) @Type(() => SyncCusteioAtendidoDto)
    atendidos!: SyncCusteioAtendidoDto[];
}

export class CalcularDistanciaLinhaDto {
    /** Identificador devolvido na resposta (a planilha usa a chave da linha). */
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(60)
    chave!: string;

    /** Município atendido (origem), na UF do custeio. */
    @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)
    origem!: string;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refRt?: string | null;

    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160)
    refHd?: string | null;

    /** UF das referências sem sufixo "/UF" (deslocamento interestadual); vazio = UF do custeio. */
    @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @Length(2, 2)
    refUf?: string | null;
}

export class CalcularDistanciasDto {
    @ApiProperty() @IsString() @Length(2, 2)
    uf!: string;

    @ApiProperty({ type: [CalcularDistanciaLinhaDto] })
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20)
    @ValidateNested({ each: true }) @Type(() => CalcularDistanciaLinhaDto)
    linhas!: CalcularDistanciaLinhaDto[];
}

export class SyncCusteioUfDto {
    /** Estado final da UF: o que não estiver aqui é removido. */
    @ApiProperty({ type: [SyncCusteioResponsavelDto] })
    @IsArray() @ArrayMaxSize(300)
    @ValidateNested({ each: true }) @Type(() => SyncCusteioResponsavelDto)
    responsaveis!: SyncCusteioResponsavelDto[];
}
