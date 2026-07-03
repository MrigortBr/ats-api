import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({ example: "usuario@saude.gov.br" })
    @IsString() @IsNotEmpty()
    login!: string;

    @ApiProperty({ example: "senha123" })
    @IsString() @IsNotEmpty()
    password!: string;
}
