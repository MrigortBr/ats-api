import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "./entities/role.entity";

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,
    ) {}

    findAll(): Promise<Role[]> {
        return this.repo.find({
            relations: { roleModules: true },
            order: { id: "ASC" },
        });
    }
}
