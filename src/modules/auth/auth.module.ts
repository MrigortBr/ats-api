import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { ModuleGuard } from "./guards/module.guard";
import { Users } from "./entities/user.entity";
import { Role } from "../role/entities/role.entity";
import { RoleModule as RoleModuleEntity } from "../role/entities/role-module.entity";
import { RedisModule } from "../redis/redis.module";
import { TokenBlocklistService } from "./services/token-blocklist.service";

@Module({
    imports: [
        RedisModule,
        TypeOrmModule.forFeature([Users, Role, RoleModuleEntity]),
        PassportModule,
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET ?? "default_secret",
                signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? "30m") as any },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository, JwtStrategy, ModuleGuard, Reflector, TokenBlocklistService],
    exports: [JwtModule, PassportModule, ModuleGuard, Reflector],
})
export class AuthModule {}
