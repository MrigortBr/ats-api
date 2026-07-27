import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateFluxoComentarioDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    texto!: string;

    @IsOptional()
    @IsUrl()
    url?: string;
}
