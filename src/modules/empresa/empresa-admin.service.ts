import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Company } from "../company/entities/company.entity";
import { Users } from "../auth/entities/user.entity";
import { Role } from "../role/entities/role.entity";
import { EmailService } from "../email/email.service";
import {
    CreateCompanyAdminDto,
    UpdateCompanyAdminDto,
    CreateCompanyUserDto,
} from "./dto/empresa-admin.dto";

/** Usuário autenticado extraído do JWT pelo JwtAuthGuard. */
export interface AdminUser {
    id: number;
    companyId: number | null;
    companyScopes: Record<string, number[] | null>;
    modules: string[];
}

/** Verifica se o usuário é gestor_geral (companyScopes["gestor"] === null). */
function isGestorGeral(user: AdminUser): boolean {
    return user.companyScopes["gestor"] === null;
}

/**
 * Verifica se o usuário tem escopo sobre determinada empresa.
 * admin e gestor_geral acessam tudo; gestor_empresa acessa só o próprio escopo.
 */
function assertCompanyScope(user: AdminUser, targetCompanyId: number): void {
    if (user.modules.includes("admin")) return;
    if (isGestorGeral(user)) return;

    const allowed = user.companyScopes["gestor"];
    if (!Array.isArray(allowed) || !allowed.includes(targetCompanyId)) {
        throw new ForbiddenException(
            `Acesso negado: empresa ${targetCompanyId} fora do escopo do usuario`,
        );
    }
}

/** Gera senha inicial: PrimeiroNomeÚltimoNome + 3 chars empresa + 3 dígitos. */
function generatePassword(
    firstName: string,
    lastName: string,
    companyName: string,
): string {
    const companyPart = companyName.replace(/\s/g, "").slice(0, 3).toUpperCase();
    const digits = Array.from({ length: 3 }, () =>
        String(Math.floor(Math.random() * 9) + 1),
    ).join("");
    return `${firstName}${lastName}${companyPart}${digits}`;
}

@Injectable()
export class EmpresaAdminService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        @InjectRepository(Users)
        private readonly userRepo: Repository<Users>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        private readonly emailService: EmailService,
    ) {}

    // ─── Companies ────────────────────────────────────────────────────────────

    /** Lista empresas dentro do escopo do usuário, com estatísticas de combos e funcionários. */
    async findCompanies(user: AdminUser): Promise<Array<{
        id: number; name: string; cnpj: string | null;
        tradeName: string | null; abbreviation: string | null;
        combosAtivos: number; equipamentosEntregues: number; funcionarios: number;
    }>> {
        const params: unknown[] = [];
        let scopeClause = "";

        if (!user.modules.includes("admin") && !isGestorGeral(user)) {
            const allowed = user.companyScopes["gestor"];
            if (!Array.isArray(allowed) || allowed.length === 0) return [];
            params.push(allowed);
            scopeClause = `AND c.id = ANY($${params.length})`;
        }

        return this.companyRepo.manager.query(
            `SELECT
               c.id,
               c.name,
               c.cnpj,
               c.trade_name   AS "tradeName",
               c.abbreviation,
               COALESCE(cc_s.combos_ativos,   0)::int AS "combosAtivos",
               COALESCE(cc_s.equip_entregues, 0)::int AS "equipamentosEntregues",
               COALESCE(u_s.funcionarios,     0)::int AS "funcionarios"
             FROM companies c
             LEFT JOIN (
               SELECT
                 company_id,
                 COUNT(DISTINCT combo_code)                         AS combos_ativos,
                 COUNT(*) FILTER (WHERE delivery_date IS NOT NULL) AS equip_entregues
               FROM combo_consult
               WHERE deleted_at IS NULL
               GROUP BY company_id
             ) cc_s ON cc_s.company_id = c.id
             LEFT JOIN (
               SELECT company_id, COUNT(*) AS funcionarios
               FROM users
               WHERE deleted_at IS NULL
               GROUP BY company_id
             ) u_s ON u_s.company_id = c.id
             WHERE c.deleted_at IS NULL ${scopeClause}
             ORDER BY c.name`,
            params,
        );
    }

    /** Cria empresa. Restrito a gestor_geral e admin. */
    async createCompany(
        user: AdminUser,
        dto: CreateCompanyAdminDto,
    ): Promise<Company> {
        if (!user.modules.includes("admin") && !isGestorGeral(user)) {
            throw new ForbiddenException("Apenas gestor_geral pode criar empresas");
        }
        const company = this.companyRepo.create(dto);
        return this.companyRepo.save(company);
    }

    /** Atualiza empresa. gestor_geral atualiza qualquer uma; gestor_empresa só a própria. */
    async updateCompany(
        user: AdminUser,
        companyId: number,
        dto: UpdateCompanyAdminDto,
    ): Promise<Company> {
        assertCompanyScope(user, companyId);
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) throw new NotFoundException(`Empresa ${companyId} não encontrada`);
        Object.assign(company, dto);
        return this.companyRepo.save(company);
    }

    /** Soft-delete de empresa. Restrito a gestor_geral e admin. */
    async removeCompany(user: AdminUser, companyId: number): Promise<void> {
        if (!user.modules.includes("admin") && !isGestorGeral(user)) {
            throw new ForbiddenException("Apenas gestor_geral pode inativar empresas");
        }
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) throw new NotFoundException(`Empresa ${companyId} não encontrada`);
        await this.companyRepo.softDelete(companyId);
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    /** Lista usuários da empresa. */
    async findUsers(user: AdminUser, companyId: number): Promise<{
        id: number; name: string; surname: string; email: string;
        roleId: number | null; roleName: string | null;
    }[]> {
        assertCompanyScope(user, companyId);
        const users = await this.userRepo.find({
            where: { companyId },
            relations: { roleEntity: true },
            order: { name: "ASC" },
        });
        return users.map(u => ({
            id:       u.id,
            name:     u.name,
            surname:  u.surname,
            email:    u.email,
            roleId:   u.roleId,
            roleName: u.roleEntity?.name ?? null,
        }));
    }

    /**
     * Cria usuário vinculado à empresa.
     *
     * - gestor_geral pode criar funcionario ou gestor_empresa.
     * - gestor_empresa pode criar apenas funcionario.
     */
    async createUser(
        requestor: AdminUser,
        companyId: number,
        dto: CreateCompanyUserDto,
    ): Promise<{ user: Users; password: string }> {
        assertCompanyScope(requestor, companyId);

        const roleName = dto.role ?? "funcionario";

        if (roleName === "gestor_empresa" && !isGestorGeral(requestor)) {
            throw new ForbiddenException(
                "Apenas gestor_geral pode criar usuarios com role gestor_empresa",
            );
        }

        const role = await this.roleRepo.findOne({ where: { name: roleName } });
        if (!role) {
            throw new NotFoundException(`Role '${roleName}' não encontrada. Execute o seed de roles.`);
        }

        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) throw new NotFoundException(`Empresa ${companyId} não encontrada`);

        const plainPassword = generatePassword(dto.firstName, dto.lastName, company.name);
        const hashed = await bcrypt.hash(plainPassword, Number(process.env.HASH_AMOUNT ?? 12));

        const newUser = this.userRepo.create({
            name:      dto.firstName,
            surname:   dto.lastName,
            email:     dto.email,
            password:  hashed,
            roleId:    role.id,
            companyId,
        });

        const saved = await this.userRepo.save(newUser);

        // Envio de e-mail não-bloqueante — falha silenciosa se SMTP não configurado.
        void this.emailService.sendWelcome({
            to:          dto.email,
            firstName:   dto.firstName,
            companyName: company.tradeName ?? company.name,
            password:    plainPassword,
        });

        return { user: saved, password: plainPassword };
    }

    /** Soft-delete de usuário dentro do escopo. */
    async removeUser(
        requestor: AdminUser,
        companyId: number,
        userId: number,
    ): Promise<void> {
        assertCompanyScope(requestor, companyId);

        const user = await this.userRepo.findOne({
            where: { id: userId, companyId },
        });
        if (!user) {
            throw new NotFoundException(
                `Usuario ${userId} não encontrado na empresa ${companyId}`,
            );
        }

        await this.userRepo.softDelete(userId);
    }
    /** Gera nova senha e reenvia o e-mail de credenciais. */
    async resendCredentials(requestor: AdminUser, companyId: number, userId: number): Promise<void> {
        assertCompanyScope(requestor, companyId);

        const user = await this.userRepo.findOne({ where: { id: userId, companyId } });
        if (!user) throw new NotFoundException(`Usuário ${userId} não encontrado na empresa ${companyId}`);

        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) throw new NotFoundException(`Empresa ${companyId} não encontrada`);

        const plainPassword = generatePassword(user.name, user.surname, company.name);
        const hashed = await bcrypt.hash(plainPassword, Number(process.env.HASH_AMOUNT ?? 12));

        await this.userRepo.update(userId, { password: hashed });

        void this.emailService.sendWelcome({
            to:          user.email,
            firstName:   user.name,
            companyName: company.tradeName ?? company.name,
            password:    plainPassword,
        });
    }
}
