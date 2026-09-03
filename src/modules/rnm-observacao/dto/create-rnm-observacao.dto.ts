import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateRnmObservacaoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    texto!: string;
}
