import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateTomoObservacaoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    texto!: string;
}
