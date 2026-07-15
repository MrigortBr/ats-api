import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsEmail,
    IsIn,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
} from "class-validator";

const CNPJ_REGEX = /^\d{14}$/;

export class CreateCompanyAdminDto {
    @ApiProperty() @IsString() name!: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @Matches(CNPJ_REGEX, { message: "cnpj deve conter exatamente 14 dígitos numéricos" }) cnpj?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() tradeName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) abbreviation?: string;
}

export class UpdateCompanyAdminDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @Matches(CNPJ_REGEX, { message: "cnpj deve conter exatamente 14 dígitos numéricos" }) cnpj?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() tradeName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) abbreviation?: string;
}

export class CreateCompanyUserDto {
    @ApiProperty() @IsString() firstName!: string;
    @ApiProperty() @IsString() lastName!: string;
    @ApiProperty() @IsEmail() email!: string;

    @ApiPropertyOptional({ enum: ["funcionario", "gestor_empresa"] })
    @IsOptional()
    @IsIn(["funcionario", "gestor_empresa"])
    role?: "funcionario" | "gestor_empresa";
}
