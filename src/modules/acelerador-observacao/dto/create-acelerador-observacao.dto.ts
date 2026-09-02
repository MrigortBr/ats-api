import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateAceleradorObservacaoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    texto!: string;
}
