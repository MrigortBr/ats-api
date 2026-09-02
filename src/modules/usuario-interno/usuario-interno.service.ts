import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Users } from "../auth/entities/user.entity";
import { Role } from "../role/entities/role.entity";
import { EmailService } from "../email/email.service";
import { generatePassword } from "../../common/utils/generate-credentials";
import { CreateUsuarioInternoDto } from "./dto/create-usuario-interno.dto";

/** Roles pensadas para usuário vinculado a uma empresa — não fazem sentido para "sem empresa". */
const COMPANY_SCOPED_ROLES = new Set(["funcionario", "gestor_empresa"]);

export interface UsuarioInternoDTO {
    id: number;
    name: string;
    surname: string;
    email: string;
    roleId: number | null;
    roleName: string | null;
}

@Injectable()
export class UsuarioInternoService {
    constructor(
        @InjectRepository(Users)
        private readonly userRepo: Repository<Users>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        private readonly emailService: EmailService,
    ) {}

    /** Lista usuários sem empresa (internos — DECAN/MS, admins, gestores gerais, etc). */
    async findAll(): Promise<UsuarioInternoDTO[]> {
        const users = await this.userRepo.find({
            where: { companyId: IsNull() },
            relations: { roleEntity: true },
            order: { name: "ASC" },
        });
        return users.map(u => ({
            id: u.id,
            name: u.name,
            surname: u.surname,
            email: u.email,
            roleId: u.roleId,
            roleName: u.roleEntity?.name ?? null,
        }));
    }

    /** Cria usuário sem vínculo com empresa. Restrito a admin (ver controller). */
    async create(dto: CreateUsuarioInternoDto): Promise<{ user: UsuarioInternoDTO; password: string }> {
        const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
        if (!role) throw new NotFoundException(`Role ${dto.roleId} não encontrada`);

        if (COMPANY_SCOPED_ROLES.has(role.name)) {
            throw new ForbiddenException(
                `A role '${role.name}' é destinada a usuários vinculados a uma empresa — use o cadastro de funcionários da empresa.`,
            );
        }

        const existing = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existing) throw new ConflictException(`Já existe um usuário com o e-mail ${dto.email}`);

        const plainPassword = generatePassword(dto.firstName, dto.lastName);
        const hashed = await bcrypt.hash(plainPassword, Number(process.env.HASH_AMOUNT ?? 12));

        const newUser = this.userRepo.create({
            name: dto.firstName,
            surname: dto.lastName,
            email: dto.email,
            password: hashed,
            roleId: role.id,
            companyId: null,
        });
        const saved = await this.userRepo.save(newUser);

        // Envio de e-mail não-bloqueante — falha silenciosa se SMTP não configurado.
        void this.emailService.sendWelcome({
            to: dto.email,
            firstName: dto.firstName,
            password: plainPassword,
        });

        return {
            user: {
                id: saved.id,
                name: saved.name,
                surname: saved.surname,
                email: saved.email,
                roleId: saved.roleId,
                roleName: role.name,
            },
            password: plainPassword,
        };
    }

    /** Gera nova senha e reenvia o e-mail de credenciais. */
    async resendCredentials(id: number): Promise<void> {
        const user = await this.userRepo.findOne({ where: { id, companyId: IsNull() } });
        if (!user) throw new NotFoundException(`Usuário ${id} não encontrado entre os usuários sem empresa`);

        const plainPassword = generatePassword(user.name, user.surname);
        const hashed = await bcrypt.hash(plainPassword, Number(process.env.HASH_AMOUNT ?? 12));
        await this.userRepo.update(id, { password: hashed });

        void this.emailService.sendWelcome({
            to: user.email,
            firstName: user.name,
            password: plainPassword,
        });
    }

    /** Soft-delete de usuário sem empresa. */
    async remove(id: number): Promise<void> {
        const user = await this.userRepo.findOne({ where: { id, companyId: IsNull() } });
        if (!user) throw new NotFoundException(`Usuário ${id} não encontrado entre os usuários sem empresa`);
        await this.userRepo.softDelete(id);
    }
}
