import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { EmpresaAdminService, AdminUser } from "./empresa-admin.service";
import { Company } from "../company/entities/company.entity";
import { Users } from "../auth/entities/user.entity";
import { Role } from "../role/entities/role.entity";
import { EmailService } from "../email/email.service";

// ─── fábricas ─────────────────────────────────────────────────────────────────

function makeRepo<T>(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        findOne:    jest.fn(),
        find:       jest.fn(),
        save:       jest.fn(),
        create:     jest.fn((dto: Partial<T>) => dto as T),
        softDelete: jest.fn(),
        update:     jest.fn(),
        manager:    { query: jest.fn() },
        ...overrides,
    } as unknown as Repository<T>;
}

function makeEmail(): EmailService {
    return { sendWelcome: jest.fn().mockResolvedValue(undefined) } as unknown as EmailService;
}

function makeCompany(partial: Partial<Company> = {}): Company {
    return {
        id:           1,
        name:         "Hospital Central",
        abbreviation: "HC",
        tradeName:    null,
        cnpj:         null,
        deletedAt:    null,
        ...partial,
    } as Company;
}

function makeUser(partial: Partial<Users> = {}): Users {
    return {
        id:         10,
        name:       "João",
        surname:    "Silva",
        email:      "joao@hc.com",
        companyId:  1,
        roleId:     2,
        roleEntity: { id: 2, name: "funcionario" } as Role,
        ...partial,
    } as Users;
}

function makeRole(name: string): Role {
    return { id: 5, name } as Role;
}

function makeService(
    companyRepo: Repository<Company>,
    userRepo: Repository<Users>,
    roleRepo: Repository<Role>,
    email: EmailService,
) {
    return new EmpresaAdminService(companyRepo, userRepo, roleRepo, email);
}

// ─── usuários de teste (AdminUser) ────────────────────────────────────────────

const ADMIN: AdminUser = {
    id: 1, companyId: null,
    modules: ["admin"],
    companyScopes: {},
    writeModules: [],
} as unknown as AdminUser;

const GESTOR_GERAL: AdminUser = {
    id: 2, companyId: null,
    modules: ["gestor"],
    companyScopes: { gestor: null },
    writeModules: [],
} as unknown as AdminUser;

const GESTOR_EMPRESA: AdminUser = {
    id: 3, companyId: 1,
    modules: ["gestor"],
    companyScopes: { gestor: [1] },
    writeModules: [],
} as unknown as AdminUser;

const GESTOR_OUTRA: AdminUser = {
    id: 4, companyId: 99,
    modules: ["gestor"],
    companyScopes: { gestor: [99] },
    writeModules: [],
} as unknown as AdminUser;

// ─── testes ───────────────────────────────────────────────────────────────────

describe("EmpresaAdminService", () => {
    let companyRepo: Repository<Company>;
    let userRepo:    Repository<Users>;
    let roleRepo:    Repository<Role>;
    let email:       EmailService;
    let service:     EmpresaAdminService;

    beforeEach(() => {
        companyRepo = makeRepo<Company>();
        userRepo    = makeRepo<Users>();
        roleRepo    = makeRepo<Role>();
        email       = makeEmail();
        service     = makeService(companyRepo, userRepo, roleRepo, email);
    });

    // ── createCompany ──────────────────────────────────────────────────────────

    describe("createCompany", () => {
        it("admin pode criar empresa", async () => {
            const company = makeCompany();
            (companyRepo.save as jest.Mock).mockResolvedValue(company);

            const result = await service.createCompany(ADMIN, { name: "Hospital Central" } as any);
            expect(result).toEqual(company);
        });

        it("gestor_geral pode criar empresa", async () => {
            const company = makeCompany();
            (companyRepo.save as jest.Mock).mockResolvedValue(company);

            const result = await service.createCompany(GESTOR_GERAL, { name: "Hospital Central" } as any);
            expect(result).toEqual(company);
        });

        it("gestor_empresa NÃO pode criar empresa", async () => {
            await expect(
                service.createCompany(GESTOR_EMPRESA, { name: "Nova" } as any),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ── updateCompany ──────────────────────────────────────────────────────────

    describe("updateCompany", () => {
        it("gestor_empresa pode atualizar a própria empresa", async () => {
            const company = makeCompany({ id: 1 });
            (companyRepo.findOne as jest.Mock).mockResolvedValue(company);
            (companyRepo.save    as jest.Mock).mockResolvedValue(company);

            await expect(
                service.updateCompany(GESTOR_EMPRESA, 1, { name: "Atualizado" } as any),
            ).resolves.not.toThrow();
        });

        it("gestor_empresa NÃO pode atualizar empresa fora do escopo", async () => {
            await expect(
                service.updateCompany(GESTOR_EMPRESA, 99, { name: "X" } as any),
            ).rejects.toThrow(ForbiddenException);
        });

        it("lança NotFoundException quando empresa não existe", async () => {
            (companyRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.updateCompany(ADMIN, 999, { name: "X" } as any),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ── removeCompany ──────────────────────────────────────────────────────────

    describe("removeCompany", () => {
        it("admin pode remover empresa", async () => {
            (companyRepo.findOne   as jest.Mock).mockResolvedValue(makeCompany());
            (companyRepo.softDelete as jest.Mock).mockResolvedValue(undefined);

            await expect(service.removeCompany(ADMIN, 1)).resolves.not.toThrow();
            expect(companyRepo.softDelete).toHaveBeenCalledWith(1);
        });

        it("gestor_empresa NÃO pode remover empresa", async () => {
            await expect(service.removeCompany(GESTOR_EMPRESA, 1)).rejects.toThrow(ForbiddenException);
        });

        it("lança NotFoundException quando empresa não existe", async () => {
            (companyRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.removeCompany(ADMIN, 99)).rejects.toThrow(NotFoundException);
        });
    });

    // ── findUsers ──────────────────────────────────────────────────────────────

    describe("findUsers", () => {
        it("retorna usuários da empresa dentro do escopo", async () => {
            const user = makeUser();
            (userRepo.find as jest.Mock).mockResolvedValue([user]);

            const result = await service.findUsers(GESTOR_EMPRESA, 1);

            expect(result).toHaveLength(1);
            expect(result[0].email).toBe(user.email);
        });

        it("bloqueia acesso a empresa fora do escopo", async () => {
            await expect(service.findUsers(GESTOR_OUTRA, 1)).rejects.toThrow(ForbiddenException);
        });

        it("mapeia roleName a partir do roleEntity", async () => {
            const user = makeUser({ roleEntity: { id: 5, name: "gestor_empresa" } as Role });
            (userRepo.find as jest.Mock).mockResolvedValue([user]);

            const result = await service.findUsers(ADMIN, 1);
            expect(result[0].roleName).toBe("gestor_empresa");
        });

        it("retorna roleName null quando roleEntity é null", async () => {
            const user = makeUser({ roleEntity: undefined, roleId: null });
            (userRepo.find as jest.Mock).mockResolvedValue([user]);

            const result = await service.findUsers(ADMIN, 1);
            expect(result[0].roleName).toBeNull();
        });
    });

    // ── createUser ────────────────────────────────────────────────────────────

    describe("createUser", () => {
        it("cria usuário com role funcionario por padrão", async () => {
            const role    = makeRole("funcionario");
            const company = makeCompany();
            const saved   = makeUser();

            (roleRepo.findOne    as jest.Mock).mockResolvedValue(role);
            (companyRepo.findOne as jest.Mock).mockResolvedValue(company);
            (userRepo.save       as jest.Mock).mockResolvedValue(saved);

            const { user } = await service.createUser(GESTOR_GERAL, 1, {
                firstName: "Ana",
                lastName:  "Costa",
                email:     "ana@hc.com",
            } as any);

            expect(user).toEqual(saved);
        });

        it("gestor_empresa não pode criar role gestor_empresa", async () => {
            (roleRepo.findOne    as jest.Mock).mockResolvedValue(makeRole("gestor_empresa"));
            (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany());

            await expect(
                service.createUser(GESTOR_EMPRESA, 1, {
                    firstName: "X",
                    lastName:  "Y",
                    email:     "x@hc.com",
                    role:      "gestor_empresa",
                } as any),
            ).rejects.toThrow(ForbiddenException);
        });

        it("gestor_geral pode criar role gestor_empresa", async () => {
            const role    = makeRole("gestor_empresa");
            const company = makeCompany();
            const saved   = makeUser();

            (roleRepo.findOne    as jest.Mock).mockResolvedValue(role);
            (companyRepo.findOne as jest.Mock).mockResolvedValue(company);
            (userRepo.save       as jest.Mock).mockResolvedValue(saved);

            await expect(
                service.createUser(GESTOR_GERAL, 1, {
                    firstName: "X", lastName: "Y",
                    email: "x@hc.com", role: "gestor_empresa",
                } as any),
            ).resolves.not.toThrow();
        });

        it("lança NotFoundException quando role não existe", async () => {
            (roleRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.createUser(ADMIN, 1, {
                    firstName: "X", lastName: "Y", email: "x@test.com",
                } as any),
            ).rejects.toThrow(NotFoundException);
        });

        it("lança NotFoundException quando empresa não existe", async () => {
            (roleRepo.findOne    as jest.Mock).mockResolvedValue(makeRole("funcionario"));
            (companyRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.createUser(ADMIN, 99, {
                    firstName: "X", lastName: "Y", email: "x@test.com",
                } as any),
            ).rejects.toThrow(NotFoundException);
        });

        it("retorna password no formato esperado (NomeSobrenomeXXX###)", async () => {
            (roleRepo.findOne    as jest.Mock).mockResolvedValue(makeRole("funcionario"));
            (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany({ name: "Hospital Central" }));
            (userRepo.save       as jest.Mock).mockResolvedValue(makeUser());

            const { password } = await service.createUser(ADMIN, 1, {
                firstName: "João",
                lastName:  "Silva",
                email:     "joao@test.com",
            } as any);

            // Deve começar com firstName + lastName + parte da empresa + 3 dígitos
            expect(password).toMatch(/^JoãoSilvaHOS\d{3}$/);
        });

        it("dispara sendWelcome não-bloqueante", async () => {
            (roleRepo.findOne    as jest.Mock).mockResolvedValue(makeRole("funcionario"));
            (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany());
            (userRepo.save       as jest.Mock).mockResolvedValue(makeUser());

            await service.createUser(ADMIN, 1, {
                firstName: "X", lastName: "Y", email: "x@test.com",
            } as any);

            // sendWelcome é void/fire-and-forget — apenas verificamos que foi chamado
            await new Promise(r => setTimeout(r, 10));
            expect(email.sendWelcome).toHaveBeenCalled();
        });
    });

    // ── removeUser ────────────────────────────────────────────────────────────

    describe("removeUser", () => {
        it("soft-deleta usuário dentro do escopo", async () => {
            (userRepo.findOne   as jest.Mock).mockResolvedValue(makeUser());
            (userRepo.softDelete as jest.Mock).mockResolvedValue(undefined);

            await service.removeUser(GESTOR_EMPRESA, 1, 10);
            expect(userRepo.softDelete).toHaveBeenCalledWith(10);
        });

        it("bloqueia quando empresa está fora do escopo", async () => {
            await expect(service.removeUser(GESTOR_OUTRA, 1, 10)).rejects.toThrow(ForbiddenException);
        });

        it("lança NotFoundException quando usuário não pertence à empresa", async () => {
            (userRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.removeUser(ADMIN, 1, 999)).rejects.toThrow(NotFoundException);
        });
    });

    // ── resendCredentials ─────────────────────────────────────────────────────

    describe("resendCredentials", () => {
        it("atualiza senha e envia email", async () => {
            (userRepo.findOne    as jest.Mock).mockResolvedValue(makeUser());
            (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany());
            (userRepo.update     as jest.Mock).mockResolvedValue(undefined);

            await expect(service.resendCredentials(ADMIN, 1, 10)).resolves.not.toThrow();
            expect(userRepo.update).toHaveBeenCalledWith(10, expect.objectContaining({ password: expect.any(String) }));
        });

        it("lança NotFoundException quando usuário não encontrado", async () => {
            (userRepo.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.resendCredentials(ADMIN, 1, 999)).rejects.toThrow(NotFoundException);
        });
    });
});
