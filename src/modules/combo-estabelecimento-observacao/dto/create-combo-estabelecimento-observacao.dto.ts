import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateComboEstabelecimentoObservacaoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    texto!: string;
}
