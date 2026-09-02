import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { UsuarioInternoService } from "./usuario-interno.service";
import { CreateUsuarioInternoDto } from "./dto/create-usuario-interno.dto";

/**
 * Usuários "sem empresa" — internos ao DECAN/MS (admin, gestor_geral, gestores de módulo, etc).
 * Restrito a administradores: só quem tem o módulo "admin" pode listar/criar/remover.
 */
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("admin")
@Controller("/usuarios-internos")
export class UsuarioInternoController {
    constructor(private readonly service: UsuarioInternoService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Post()
    create(@Body() dto: CreateUsuarioInternoDto) {
        return this.service.create(dto);
    }

    @Post(":id/resend-credentials")
    @HttpCode(204)
    resendCredentials(@Param("id", ParseIntPipe) id: number) {
        return this.service.resendCredentials(id);
    }

    @Delete(":id")
    @HttpCode(204)
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
