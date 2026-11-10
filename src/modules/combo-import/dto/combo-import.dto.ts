import { ArrayMaxSize, IsArray, IsObject } from "class-validator";

export class ComboImportDto {
    /** Linhas da aba Consulta_Consolidada: cabeçalho -> valor da célula. */
    @IsArray()
    @ArrayMaxSize(5000)
    @IsObject({ each: true })
    rows!: Record<string, unknown>[];
}
