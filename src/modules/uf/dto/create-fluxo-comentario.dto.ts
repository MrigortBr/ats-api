import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateFluxoComentarioDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    texto!: string;
}
