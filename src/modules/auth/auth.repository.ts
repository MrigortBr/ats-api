import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Users } from "./entities/user.entity";

interface CreateUserData {
    name: string;
    surname: string;
    email: string;
    password: string;
    roleId?: number | null;
    companyId?: number | null;
}

@Injectable()
export class AuthRepository {
    constructor(
        @InjectRepository(Users)
        private readonly userRepository: Repository<Users>,
    ) {}

    async findByEmail(email: string): Promise<Users | null> {
        return this.userRepository.findOne({
            where: { email },
            relations: { roleEntity: { roleModules: true } },
        });
    }

    async findById(id: number): Promise<Users | null> {
        return this.userRepository.findOne({
            where: { id },
            relations: { roleEntity: { roleModules: true } },
        });
    }

    async create(data: CreateUserData): Promise<Users> {
        const user = this.userRepository.create({
            name:      data.name,
            surname:   data.surname,
            email:     data.email,
            password:  data.password,
            roleId:    data.roleId ?? null,
            companyId: data.companyId ?? null,
        });
        return this.userRepository.save(user);
    }
}
