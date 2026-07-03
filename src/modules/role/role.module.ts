import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { RoleModule as RoleModuleEntity } from "./entities/role-module.entity";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";

@Module({
    imports: [TypeOrmModule.forFeature([Role, RoleModuleEntity])],
    controllers: [RoleController],
    providers: [RoleService],
    exports: [TypeOrmModule],
})
export class RoleModule {}
