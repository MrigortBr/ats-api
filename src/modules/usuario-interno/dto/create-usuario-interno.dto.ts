import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateUsuarioInternoDto {
    @ApiProperty({ example: "João" })
    @IsString() @IsNotEmpty()
    firstName!: string;

    @ApiProperty({ example: "Silva" })
    @IsString() @IsNotEmpty()
    lastName!: string;

    @ApiProperty({ example: "joao.silva@saude.gov.br" })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 1, description: "id da role (ver GET /roles)" })
    @IsInt()
    roleId!: number;
}
