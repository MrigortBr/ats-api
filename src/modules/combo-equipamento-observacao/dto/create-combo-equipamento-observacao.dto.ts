import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateComboEquipamentoObservacaoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    texto!: string;
}
