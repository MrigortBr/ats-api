import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class ImportSisconvRowDto {
    @IsString() @IsNotEmpty() equipamento!: string;
    @IsString() @IsNotEmpty() convenio!: string;
    @IsString() @IsNotEmpty() entidade!: string;
    @IsString() @IsNotEmpty() uf!: string;
    @IsString() @IsNotEmpty() municipio!: string;
    @IsOptional() @IsString() dataPublicacao?: string | null;
    @IsOptional() @IsNumber() valorGlobal?: number | null;
    @IsString() @IsNotEmpty() situacao!: string;
}

export class ImportSisconvDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ImportSisconvRowDto)
    rows!: ImportSisconvRowDto[];
}

export class ImportSisproRowDto {
    @IsString() @IsNotEmpty() equipamento!: string;
    @IsOptional() @IsString() regiao?: string | null;
    @IsOptional() @IsString() uf?: string | null;
    @IsOptional() @IsString() municipio?: string | null;
    @IsOptional() @IsString() entidade?: string | null;
    @IsOptional() @IsString() nuProposta?: string | null;
    @IsOptional() @IsString() nuProcesso?: string | null;
    @IsOptional() @IsString() convenio?: string | null;
    @IsOptional() @IsString() ano?: string | null;
    @IsOptional() @IsBoolean() pendente?: boolean;
}

export class ImportSisproDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ImportSisproRowDto)
    rows!: ImportSisproRowDto[];
}
