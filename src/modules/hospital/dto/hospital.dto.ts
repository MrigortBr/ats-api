import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsArray, IsNotEmpty, IsIn, IsBoolean, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UpdateHospitalTomoDto {
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contract?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() structure90Days?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formSent?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formReceived?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactNotes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactResponsible?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() priorityGroup?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryOrder?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() construction?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() installed?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cnes?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() ebserhPriority?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryDate?: string | null;
    @ApiPropertyOptional({ enum: ["E", "M", "D"] }) @IsOptional() @IsString() gestao?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() naturezaJuridica?: string | null;
}

export class UpdateHospitalRnmDto {
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contract?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() structure90Days?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formSent?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formReceived?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactNotes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactResponsible?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() priorityGroup?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryOrder?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() construction?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() installed?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() ebserhPriority?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cnes?: string | null;
    @ApiPropertyOptional({ enum: ["E", "M", "D"] }) @IsOptional() @IsString() gestao?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() naturezaJuridica?: string | null;
}

export class CreateHospitalDto {
    @ApiProperty({ description: "CNES do estabelecimento (7 dígitos)" })
    @IsString()
    @IsNotEmpty()
    cnes!: string;

    @ApiProperty({ description: "Módulo de destino: 'tomo' ou 'rnm'", enum: ["tomo", "rnm"] })
    @IsIn(["tomo", "rnm"])
    module!: "tomo" | "rnm";

    @ApiPropertyOptional({ description: "Dados TOMO iniciais (opcionais, só para module='tomo')" })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateHospitalTomoDto)
    tomo?: UpdateHospitalTomoDto;
}

export class UpdateHospitalDto {
    @ApiPropertyOptional() @IsOptional() @IsString() cnes?: string | null;
    @ApiPropertyOptional({ enum: ["E", "M", "D"] }) @IsOptional() @IsString() gestao?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() naturezaJuridica?: string | null;
}

export class BulkCreateHospitalDto {
    @ApiProperty({ description: "Array de CNES para importação em massa", type: [String] })
    @IsArray()
    cnesList!: string[];
}
