import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsEmail,
    IsIn,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";

export class CreateCompanyAdminDto {
    @ApiProperty() @IsString() name!: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cnpj?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() tradeName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) abbreviation?: string;
}

export class UpdateCompanyAdminDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cnpj?: string;
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
