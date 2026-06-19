import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { validatePayload } from "../../utils/payload";
import { CreateUserDto, LoginDto } from "./dto/create-user.dto";
import * as payload from "./type/payload";

@ApiTags("auth")
@Controller("/auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("/login")
    @ApiOperation({ summary: "Login - retorna JWT" })
    @ApiBody({ type: LoginDto })
    async login(@Body() body: LoginDto) {
        validatePayload(body as unknown as Record<string, unknown>, ["login", "password"], true);
        return this.authService.login(body as unknown as payload.login);
    }

    @Post("/users")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("admin")
    @ApiBearerAuth("bearer")
    @ApiOperation({ summary: "Criar usuario (apenas admin)" })
    @ApiBody({ type: CreateUserDto })
    async createUser(@Body() body: CreateUserDto) {
        validatePayload(body as unknown as Record<string, unknown>, ["email", "name", "surname", "role"], true);
        return this.authService.createUser(body as unknown as payload.createUser);
    }
}
