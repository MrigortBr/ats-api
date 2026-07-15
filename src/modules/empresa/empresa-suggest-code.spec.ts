import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { EmpresaService } from "./empresa.service";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";
import { Company } from "../company/entities/company.entity";
import { EmpresaLockService } from "./empresa-lock.service";
import { EmpresaProblemService } from "./empresa-problem.service";
import { EmpresaProblem } from "./entities/empresa-problem.entity";
import { Hospital } from "../hospital/entities/hospital.entity";

// ─── Utilitários ──────────────────────────────────────────────────────────────

function makeCompany(partial: Partial<Company> = {}): Company {
    return {
        id:           1,
        name:         "Aventis Distribuidora",
        abbreviation: "ADV",
        tradeName:    null,
        cnpj:         null,
        deletedAt:    null,
        ...partial,
    } as Company;
}

function makeRepo<T>(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        findOne: jest.fn(),
        find:    jest.fn(),
        save:    jest.fn(),
        create:  jest.fn(),
        manager: { query: jest.fn() },
        ...overrides,
    } as unknown as Repository<T>;
}

function makeService(
    consultRepo: Repository<ComboConsult>,
    companyRepo: Repository<Company>,
) {
    return new EmpresaService(
        consultRepo,
        {} as Repository<EmpresaProblem>,
        {} as Repository<Hospital>,
        companyRepo,
        {} as EmpresaLockService,
        {} as EmpresaProblemService,
    );
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("EmpresaService.suggestComboCode", () => {
    let consultRepo: Repository<ComboConsult>;
    let companyRepo: Repository<Company>;
    let service: EmpresaService;

    beforeEach(() => {
        consultRepo = makeRepo<ComboConsult>();
        companyRepo = makeRepo<Company>();
        service = makeService(consultRepo, companyRepo);
    });

    it("deve lancar NotFoundException quando empresa nao existe", async () => {
        (companyRepo.findOne as jest.Mock).mockResolvedValue(null);

        await expect(service.suggestComboCode(99)).rejects.toThrow(NotFoundException);
    });

    it("deve retornar codigo 0001 quando nao ha nenhum registro", async () => {
        (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany());
        (consultRepo.manager.query as jest.Mock).mockRejectedValue(new Error("relation combo_equipamento does not exist"));
        // Fallback query retorna max_num = 0
        (consultRepo.manager.query as jest.Mock)
            .mockRejectedValueOnce(new Error("relation combo_equipamento does not exist"))
            .mockResolvedValueOnce([{ max_num: "0" }]);

        const code = await service.suggestComboCode(1);
        expect(code).toBe("ADV_0001");
    });

    it("deve retornar proximo codigo sequencial apos o maximo existente", async () => {
        (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany());
        // UNION ALL bem-sucedido retorna max = 101
        (consultRepo.manager.query as jest.Mock).mockResolvedValue([{ max_num: "101" }]);

        const code = await service.suggestComboCode(1);
        expect(code).toBe("ADV_0102");
    });

    it("deve incluir registros soft-deleted no calculo do maximo", async () => {
        (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany());
        // Simula que existem codigos ate 50 ativos e ate 101 historicos (soft-deleted)
        (consultRepo.manager.query as jest.Mock).mockResolvedValue([{ max_num: "101" }]);

        const code = await service.suggestComboCode(1);
        // Sem filtro deleted_at IS NULL, MAX correto e 101 → proximo e 102
        expect(code).toBe("ADV_0102");
    });

    it("deve usar abbreviation da empresa para montar o prefixo", async () => {
        const company = makeCompany({ abbreviation: "HOSP" });
        (companyRepo.findOne as jest.Mock).mockResolvedValue(company);
        (consultRepo.manager.query as jest.Mock).mockResolvedValue([{ max_num: "5" }]);

        const code = await service.suggestComboCode(1);
        expect(code).toMatch(/^HOSP_/);
        expect(code).toBe("HOSP_0006");
    });

    it("deve usar primeiros 3 chars do nome quando abbreviation e null", async () => {
        const company = makeCompany({ abbreviation: null, name: "Hospital das Clínicas" });
        (companyRepo.findOne as jest.Mock).mockResolvedValue(company);
        (consultRepo.manager.query as jest.Mock).mockResolvedValue([{ max_num: "0" }]);

        const code = await service.suggestComboCode(1);
        expect(code).toMatch(/^HOS_/);
    });

    it("deve preencher numero com zeros ate 4 digitos", async () => {
        (companyRepo.findOne as jest.Mock).mockResolvedValue(makeCompany());
        (consultRepo.manager.query as jest.Mock).mockResolvedValue([{ max_num: "9" }]);

        const code = await service.suggestComboCode(1);
        expect(code).toBe("ADV_0010");
    });
});
