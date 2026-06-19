import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({ example: "Joao" })
    name!: string;

    @ApiProperty({ example: "Silva" })
    surname!: string;

    @ApiProperty({ example: "joao@saude.gov.br" })
    email!: string;

    @ApiProperty({ example: "senha123", required: false, description: "Se omitido, gerado automaticamente: NomeSobrenome + 3 digitos" })
    password?: string;

    @ApiProperty({ enum: ["admin", "gestor", "visualizador"], example: "gestor" })
    role!: string;
}

export class LoginDto {
    @ApiProperty({ example: "usuario@saude.gov.br" })
    login!: string;

    @ApiProperty({ example: "senha123" })
    password!: string;
}
