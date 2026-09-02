import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { Users } from "../auth/entities/user.entity";
import { Role } from "../role/entities/role.entity";
import { EmailModule } from "../email/email.module";
import { UsuarioInternoService } from "./usuario-interno.service";
import { UsuarioInternoController } from "./usuario-interno.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Users, Role]), EmailModule],
    controllers: [UsuarioInternoController],
    providers: [UsuarioInternoService, Reflector],
    exports: [UsuarioInternoService],
})
export class UsuarioInternoModule {}
