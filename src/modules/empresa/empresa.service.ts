import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";
import { Company } from "../company/entities/company.entity";
import { EmpresaProblem } from "./entities/empresa-problem.entity";
import { HospitalService } from "../hospital/hospital.service";
import { HospitalComboService } from "../hospital/hospital-combo.service";
import { EmpresaLockService } from "./empresa-lock.service";
import { EmpresaProblemService } from "./empresa-problem.service";
import { EmpresaPainelService } from "./empresa-painel.service";
import {
    UpdateEmpresaEquipamentoDto,
    UpdateEmpresaContatoDto,
    UpdateAdminEquipamentoDto,
    UpdateAdminContatoDto,
    CreateAdminEquipamentoDto,
    CreateComboCompletoDto,
    CreateEmpresaProblemDto,
    UpdateEmpresaProblemDto,
} from "./dto/empresa.dto";

@Injectable()
export class EmpresaService {
    constructor(
        @InjectRepository(ComboConsult)
        private readonly consultRepo: Repository<ComboConsult>,
        @InjectRepository(EmpresaProblem)
        private readonly problemRepo: Repository<EmpresaProblem>,
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        private readonly hospitalService: HospitalService,
        private readonly hospitalComboService: HospitalComboService,
        private readonly lockService: EmpresaLockService,
        private readonly problemService: EmpresaProblemService,
        private readonly painelService: EmpresaPainelService,
    ) {}

    // ── Mapeamento interno ───────────────────────────────────────────────────────

    private mapConsult(c: ComboConsult) {
        return {
            id:                     c.id,
            equipKey:               c.equipKey,
            estabKey:               c.estabKey,
            ufMunicipio:            c.ufMunicipio,
            region:                 c.region,
            uf:                     c.uf,
            municipality:           c.municipality,
            ibge:                   c.ibge,
            cnes:                   c.cnes,
            establishmentName:      c.establishmentName,
            cnpj:                   c.cnpj,
            comboCode:              c.comboCode,
            comboType:              c.comboType,
            contract:               c.contract,
            deliveryParcel:         c.deliveryParcel,
            equipmentName:          c.equipmentName,
            serialNumber:           c.serialNumber,
            expeditionDate:         c.expeditionDate,
            deliveryForecast:       c.deliveryForecast,
            deliveryDate:           c.deliveryDate,
            installationDate:       c.installationDate,
            trainingDate:           c.trainingDate,
            deliveryStatus:         c.deliveryStatus,
            equipmentCount:         c.equipmentCount,
            nfSent:                 c.nfSent,
            nfNumber:               c.nfNumber,
            nfSentDate:             c.nfSentDate,
            nfValue:                c.nfValue,
            provisionalReceiptSent: c.provisionalReceiptSent,
            finalReceiptSent:       c.finalReceiptSent,
            payment1Value:          c.payment1Value,
            payment1Nup:            c.payment1Nup,
            payment1SentDate:       c.payment1SentDate,
            payment2Value:          c.payment2Value,
            payment2Nup:            c.payment2Nup,
            payment2SentDate:       c.payment2SentDate,
            payment2Deadline:       c.payment2Deadline,
            totalPaid:              c.totalPaid,
            paymentStatus:          c.paymentStatus,
            notes:                  c.notes,
            address:                c.address,
            managerData:            c.managerData,
            managerPhone:           c.managerPhone,
            focalPointData:         c.focalPointData,
            focalPointPhone:        c.focalPointPhone,
            establishmentEmail:     c.establishmentEmail,
            focalPointEmail:        c.focalPointEmail,
            lockedBy:               c.lockedBy ?? null,
            lockedAt:               c.lockedAt?.toISOString() ?? null,
            hospitalId:             c.hospitalId,
            companyId:              c.companyId,
            companyName:            c.company?.tradeName ?? c.company?.name ?? null,
        };
    }

    /** Copia campos de estabelecimento do template e mescla campos do DTO. */
    private buildEquipamentoFromTemplate(
        template: ComboConsult,
        dto: CreateAdminEquipamentoDto,
    ): ReturnType<typeof this.consultRepo.create> {
        return this.consultRepo.create({
            estabKey:           template.estabKey,
            ufMunicipio:        template.ufMunicipio,
            region:             template.region,
            uf:                 template.uf,
            municipality:       template.municipality,
            ibge:               template.ibge,
            cnes:               template.cnes,
            establishmentName:  template.establishmentName,
            cnpj:               template.cnpj,
            comboType:          template.comboType,
            contract:           template.contract,
            deliveryParcel:     template.deliveryParcel,
            address:            template.address,
            managerData:        template.managerData,
            managerPhone:       template.managerPhone,
            focalPointData:     template.focalPointData,
            focalPointPhone:    template.focalPointPhone,
            establishmentEmail: template.establishmentEmail,
            focalPointEmail:    template.focalPointEmail,
            hospitalId:         template.hospitalId,
            companyId:          template.companyId,
            equipmentName:          dto.equipmentName,
            comboCode:              dto.comboCode              ?? null,
            serialNumber:           dto.serialNumber           ?? null,
            nfSent:                 dto.nfSent                 ?? null,
            nfNumber:               dto.nfNumber               ?? null,
            nfSentDate:             dto.nfSentDate             ?? null,
            nfValue:                dto.nfValue                ?? null,
            provisionalReceiptSent: dto.provisionalReceiptSent ?? null,
            finalReceiptSent:       dto.finalReceiptSent       ?? null,
            payment1Value:          dto.payment1Value          ?? null,
            payment1Nup:            dto.payment1Nup            ?? null,
            payment1SentDate:       dto.payment1SentDate       ?? null,
            payment2Value:          dto.payment2Value          ?? null,
            payment2Nup:            dto.payment2Nup            ?? null,
            payment2SentDate:       dto.payment2SentDate       ?? null,
            payment2Deadline:       dto.payment2Deadline       ?? null,
            totalPaid:              dto.totalPaid              ?? null,
            paymentStatus:          dto.paymentStatus          ?? null,
        });
    }

    // ── Leitura (empresa) ────────────────────────────────────────────────────────

    async findRelatorio(companyId: number) {
        const rows = await this.consultRepo.find({
            where: { companyId },
            relations: { company: true },
            order: { uf: "ASC", establishmentName: "ASC", id: "ASC" },
        });
        return rows.map((c) => this.mapConsult(c));
    }

    async findContatos(companyId: number) {
        const rows = await this.consultRepo
            .createQueryBuilder("c")
            .where("c.company_id = :companyId", { companyId })
            .andWhere("c.deleted_at IS NULL")
            .distinctOn(["c.estab_key"])
            .orderBy("c.estab_key", "ASC")
            .getMany();
        return rows.map((c) => ({
            id:                 c.id,
            estabKey:           c.estabKey,
            comboType:          c.comboType,
            cnes:               c.cnes,
            establishmentName:  c.establishmentName,
            cnpj:               c.cnpj,
            uf:                 c.uf,
            municipality:       c.municipality,
            address:            c.address,
            managerData:        c.managerData,
            managerPhone:       c.managerPhone,
            focalPointData:     c.focalPointData,
            focalPointPhone:    c.focalPointPhone,
            focalPointEmail:    c.focalPointEmail,
            establishmentEmail: c.establishmentEmail,
        }));
    }

    async findMyCompany(companyId: number): Promise<{ id: number; name: string; tradeName: string | null; abbreviation: string | null; cnpj: string | null }> {
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) throw new NotFoundException(`Empresa ${companyId} nao encontrada`);
        return {
            id:           company.id,
            name:         company.name,
            tradeName:    company.tradeName,
            abbreviation: company.abbreviation,
            cnpj:         company.cnpj,
        };
    }

    // ── Escrita (empresa) ────────────────────────────────────────────────────────

    async updateEquipamento(id: number, dto: UpdateEmpresaEquipamentoDto, companyId: number) {
        const consult = await this.consultRepo.findOne({ where: { id } });
        if (!consult || consult.companyId !== companyId) {
            throw new NotFoundException(`Registro ${id} nao encontrado`);
        }
        const allowed: (keyof UpdateEmpresaEquipamentoDto)[] = [
            "serialNumber", "nfSent", "nfNumber", "nfSentDate",
            "nfValue", "provisionalReceiptSent", "finalReceiptSent",
        ];
        for (const key of allowed) {
            if (key in dto) (consult as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.consultRepo.save(consult);
    }

    async updateContato(id: number, dto: UpdateEmpresaContatoDto, companyId: number) {
        const consult = await this.consultRepo.findOne({ where: { id, companyId } });
        if (!consult) throw new NotFoundException(`Registro ${id} nao encontrado`);
        const allowed: (keyof UpdateEmpresaContatoDto)[] = [
            "installationDate", "trainingDate", "deliveryStatus", "notes",
            "address", "managerData", "managerPhone",
            "focalPointData", "focalPointPhone", "focalPointEmail", "establishmentEmail",
        ];
        for (const key of allowed) {
            if (key in dto) (consult as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.consultRepo.save(consult);
    }

    async addEmpresaEquipamento(dto: CreateAdminEquipamentoDto, companyId: number) {
        const template = await this.consultRepo.findOne({
            where: { id: dto.consultId, companyId },
        });
        if (!template) throw new NotFoundException(`Registro ${dto.consultId} nao encontrado`);
        const saved = await this.consultRepo.save(this.buildEquipamentoFromTemplate(template, dto));
        const full  = await this.consultRepo.findOne({ where: { id: saved.id }, relations: { company: true } });
        return this.mapConsult(full!);
    }

    // ── Escrita (admin) ──────────────────────────────────────────────────────────

    async updateAdminEquipamento(id: number, dto: UpdateAdminEquipamentoDto) {
        const consult = await this.consultRepo.findOne({ where: { id } });
        if (!consult) throw new NotFoundException(`Registro ${id} nao encontrado`);
        const allowed: (keyof UpdateAdminEquipamentoDto)[] = [
            "serialNumber", "nfSent", "nfNumber", "nfSentDate",
            "nfValue", "provisionalReceiptSent", "finalReceiptSent",
            "payment1Value", "payment1Nup", "payment1SentDate",
            "payment2Value", "payment2Nup", "payment2SentDate",
            "payment2Deadline", "totalPaid", "paymentStatus",
        ];
        for (const key of allowed) {
            if (key in dto) (consult as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.consultRepo.save(consult);
    }

    async updateAdminContato(id: number, dto: UpdateAdminContatoDto) {
        const consult = await this.consultRepo.findOne({ where: { id } });
        if (!consult) throw new NotFoundException(`Registro ${id} nao encontrado`);
        const allowed: (keyof UpdateAdminContatoDto)[] = [
            "installationDate", "trainingDate", "deliveryStatus", "notes",
            "contract", "deliveryParcel", "expeditionDate", "deliveryForecast", "deliveryDate",
            "equipmentCount",
            "address", "managerData", "managerPhone",
            "focalPointData", "focalPointPhone", "focalPointEmail", "establishmentEmail",
        ];
        for (const key of allowed) {
            if (key in dto) (consult as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.consultRepo.save(consult);
    }

    async createAdminEquipamento(dto: CreateAdminEquipamentoDto) {
        const template = await this.consultRepo.findOne({ where: { id: dto.consultId } });
        if (!template) throw new NotFoundException(`Registro ${dto.consultId} nao encontrado`);
        const saved = await this.consultRepo.save(this.buildEquipamentoFromTemplate(template, dto));
        const full  = await this.consultRepo.findOne({ where: { id: saved.id }, relations: { company: true } });
        return this.mapConsult(full!);
    }

    // ── Leitura (admin) ──────────────────────────────────────────────────────────

    async findAdminRelatorio(companyId: number) {
        const rows = await this.consultRepo.find({
            where: { companyId },
            relations: { company: true },
            order: { uf: "ASC", establishmentName: "ASC", id: "ASC" },
        });
        return rows.map((c) => this.mapConsult(c));
    }

    findAdminContatos(companyId: number) {
        return this.findContatos(companyId);
    }

    // ── Delegacoes: Painel ───────────────────────────────────────────────────────

    findAdminCompanies() {
        return this.painelService.findAdminCompanies();
    }

    findAdminPainelMinDate() {
        return this.painelService.findAdminPainelMinDate();
    }

    findAdminPainel() {
        return this.painelService.findAdminPainel();
    }

    // ── Hospitais (delegado a HospitalService) ───────────────────────────────────

    findAllHospitals() {
        return this.hospitalService.findAllForSelector();
    }

    // ── ComboCode sugestao ───────────────────────────────────────────────────────

    async suggestComboCode(companyId: number): Promise<string> {
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) throw new NotFoundException(`Empresa ${companyId} nao encontrada`);

        const abbr = company.abbreviation?.toUpperCase()
            ?? company.name.replace(/\s+/g, "").substring(0, 3).toUpperCase();

        const prefix = `${abbr}_`;

        // Inclui registros soft-deleted: um código já usado não pode ser reutilizado,
        // mesmo que o registro tenha sido excluído logicamente.
        let result: Array<{ max_num: string }>;
        try {
            result = await this.consultRepo.manager.query(
                `SELECT COALESCE(MAX(num), 0) AS max_num
                 FROM (
                   SELECT CAST(SUBSTRING(combo_code FROM $1) AS INTEGER) AS num
                   FROM combo_consult
                   WHERE combo_code ~ ('^' || $2 || '[0-9]+$')
                   UNION ALL
                   SELECT CAST(SUBSTRING(combo_code FROM $1) AS INTEGER) AS num
                   FROM combo_equipamento
                   WHERE combo_code ~ ('^' || $2 || '[0-9]+$')
                 ) t`,
                [prefix.length + 1, prefix],
            );
        } catch {
            // combo_equipamento nao existe — consulta apenas combo_consult
            result = await this.consultRepo.manager.query(
                `SELECT COALESCE(MAX(num), 0) AS max_num
                 FROM (
                   SELECT CAST(SUBSTRING(combo_code FROM $1) AS INTEGER) AS num
                   FROM combo_consult
                   WHERE combo_code ~ ('^' || $2 || '[0-9]+$')
                 ) t`,
                [prefix.length + 1, prefix],
            );
        }

        const maxNum = parseInt(result[0]?.max_num ?? "0", 10);
        return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
    }

    // ── Criar combo completo (delegado a HospitalComboService) ──────────────────

    async createComboCompleto(dto: CreateComboCompletoDto, companyId: number) {
        const entity = await this.hospitalComboService.createComboCompleto(dto, companyId);
        return this.mapConsult(entity);
    }

    // ── Delegacoes: Lock ─────────────────────────────────────────────────────────

    lockEquipamento(id: number, userEmail: string) {
        return this.lockService.lockEquipamento(id, userEmail);
    }

    unlockEquipamento(id: number, userEmail: string) {
        return this.lockService.unlockEquipamento(id, userEmail);
    }

    // ── Delegacoes: Problemas ────────────────────────────────────────────────────

    findProblemas(companyId: number) {
        return this.problemService.findProblemas(companyId);
    }

    findAdminProblemas(companyId: number) {
        return this.problemService.findAdminProblemas(companyId);
    }

    createProblem(dto: CreateEmpresaProblemDto, companyId: number) {
        return this.problemService.createProblem(dto, companyId);
    }

    updateProblem(id: number, dto: UpdateEmpresaProblemDto, companyId: number) {
        return this.problemService.updateProblem(id, dto, companyId);
    }

    deleteProblem(id: number, companyId: number) {
        return this.problemService.deleteProblem(id, companyId);
    }
}
