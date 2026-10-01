import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";
import { TIPOS_EVENTO, type TipoEvento } from "../entities/auditoria-evento.entity";
import {
    ACOES_DADOS,
    MODULOS_AUDITADOS,
    type AcaoDados,
    type ModuloAuditado,
} from "../entities/auditoria-alteracao.entity";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Filtros comuns das listagens de auditoria (datas no fuso de Brasilia). */
export class FiltrosAuditoriaDto {
    @ApiPropertyOptional({ example: "2026-10-01", description: "Data inicial (inclusive), AAAA-MM-DD" })
    @IsOptional() @Matches(DATA, { message: "inicio deve estar no formato AAAA-MM-DD" })
    inicio?: string;

    @ApiPropertyOptional({ example: "2026-10-31", description: "Data final (inclusive), AAAA-MM-DD" })
    @IsOptional() @Matches(DATA, { message: "fim deve estar no formato AAAA-MM-DD" })
    fim?: string;

    @ApiPropertyOptional({ description: "Trecho do e-mail do usuario" })
    @IsOptional() @IsString() @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional() @Type(() => Number) @IsInt() @Min(1)
    pagina?: number;

    @ApiPropertyOptional({ default: 25, maximum: 100 })
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
    porPagina?: number;
}

export class FiltrosAlteracoesDto extends FiltrosAuditoriaDto {
    @ApiPropertyOptional({ enum: MODULOS_AUDITADOS })
    @IsOptional() @IsIn(MODULOS_AUDITADOS)
    modulo?: ModuloAuditado;

    @ApiPropertyOptional({ enum: ACOES_DADOS })
    @IsOptional() @IsIn(ACOES_DADOS)
    acao?: AcaoDados;

    @ApiPropertyOptional({ description: "true = so falhas (status >= 400)" })
    @IsOptional() @IsIn(["true", "false"])
    falhas?: "true" | "false";
}

export class FiltrosEventosDto extends FiltrosAuditoriaDto {
    @ApiPropertyOptional({ enum: TIPOS_EVENTO })
    @IsOptional() @IsIn(TIPOS_EVENTO)
    tipo?: TipoEvento;
}
