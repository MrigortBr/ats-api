import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";
import { Hospital } from "../hospital/entities/hospital.entity";
import { Company } from "../company/entities/company.entity";
import { EmpresaProblem } from "./entities/empresa-problem.entity";
import { EmpresaLockService } from "./empresa-lock.service";
import { EmpresaProblemService } from "./empresa-problem.service";
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
        @InjectRepository(Hospital)
        private readonly hospitalRepo: Repository<Hospital>,
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        private readonly lockService: EmpresaLockService,
        private readonly problemService: EmpresaProblemService,
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

        const record = this.consultRepo.create({
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

        const saved = await this.consultRepo.save(record);
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

        const record = this.consultRepo.create({
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

        const saved = await this.consultRepo.save(record);
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

    async findAdminCompanies() {
        const companies = await this.companyRepo
            .createQueryBuilder("c")
            .select(["c.id", "c.name", "c.cnpj", "c.tradeName", "c.abbreviation"])
            .where("c.deletedAt IS NULL")
            .orderBy("c.name", "ASC")
            .getMany();

        if (companies.length === 0) return [];

        const rows = await this.consultRepo
            .createQueryBuilder("cc")
            .select("cc.company_id", "companyId")
            .addSelect("MIN(cc.combo_type)", "comboType")
            .where("cc.company_id IN (:...ids)", { ids: companies.map((c) => c.id) })
            .andWhere("cc.deleted_at IS NULL")
            .groupBy("cc.company_id")
            .getRawMany<{ companyId: number; comboType: string }>();

        const groupMap = new Map(rows.map((r) => [Number(r.companyId), r.comboType]));

        return companies.map((c) => ({
            id: c.id,
            name: c.name,
            cnpj: c.cnpj,
            tradeName: c.tradeName,
            abbreviation: c.abbreviation,
            comboGroup: groupMap.has(c.id)
                ? (groupMap.get(c.id)!.includes("OFTALMO") ? "OFTALMO" : "CIRURGIA")
                : null,
        }));
    }

    async findAdminPainel() {
        const rows = await this.consultRepo
            .createQueryBuilder("cc")
            .leftJoin("cc.company", "c")
            .select("cc.combo_type",         "combo_type")
            .addSelect("cc.delivery_status",  "delivery_status")
            .addSelect("COALESCE(cc.equipment_count, 0)", "equipment_count")
            .addSelect("c.id",               "company_id")
            .addSelect("c.name",             "company_name")
            .addSelect("c.trade_name",        "company_trade_name")
            .where("cc.deleted_at IS NULL")
            .andWhere("cc.company_id IS NOT NULL")
            .getRawMany<{
                combo_type:          string | null;
                delivery_status:     string | null;
                equipment_count:     string;
                company_id:          string | null;
                company_name:        string | null;
                company_trade_name:  string | null;
            }>();

        const byType = new Map<string, { total: number; delivered: number; totalEquip: number; deliveredEquip: number }>();
        const byComp = new Map<string, { name: string; group: string; total: number; delivered: number }>();

        for (const r of rows) {
            const group       = r.combo_type?.includes("OFTALMO") ? "OFTALMO" : "CIRURGIA";
            const equip       = Number(r.equipment_count) || 0;
            const isDelivered = (r.delivery_status ?? "").toLowerCase().includes("entregue");

            const t = byType.get(group) ?? { total: 0, delivered: 0, totalEquip: 0, deliveredEquip: 0 };
            t.total++;
            t.totalEquip += equip;
            if (isDelivered) { t.delivered++; t.deliveredEquip += equip; }
            byType.set(group, t);

            if (r.company_id) {
                const comp = byComp.get(r.company_id) ?? { name: r.company_trade_name ?? r.company_name ?? "", group, total: 0, delivered: 0 };
                comp.total += equip;
                if (isDelivered) comp.delivered += equip;
                byComp.set(r.company_id, comp);
            }
        }

        const porTipoCombo = Array.from(byType.entries()).map(([grp, v]) => ({
            comboGroup:            grp as "CIRURGIA" | "OFTALMO",
            totalCombos:           v.total,
            combosEntregues:       v.delivered,
            percentEntregues:      v.total ? Math.round((v.delivered / v.total) * 100) : 0,
            totalEquipamentos:     v.totalEquip,
            equipamentosEntregues: v.deliveredEquip,
            percentEquipEntregues: v.totalEquip ? Math.round((v.deliveredEquip / v.totalEquip) * 100) : 0,
        }));

        const porEmpresa = Array.from(byComp.values()).map(c => ({
            companyName:           c.name,
            comboGroup:            c.group as "CIRURGIA" | "OFTALMO",
            totalEquipamentos:     c.total,
            equipamentosEntregues: c.delivered,
            percentEntregues:      c.total ? Math.round((c.delivered / c.total) * 100) : 0,
            pendentes:             c.total - c.delivered,
            percentPendentes:      c.total ? Math.round(((c.total - c.delivered) / c.total) * 100) : 0,
        }));

        return { porTipoCombo, porEmpresa };
    }

    // ── Hospitais ────────────────────────────────────────────────────────────────

    async findAllHospitals() {
        const list = await this.hospitalRepo.find({
            relations: { uf: true },
            order: { uf: { uf: "ASC" }, name: "ASC" },
        });
        return list.map(h => ({
            id:           h.id,
            name:         h.name,
            cnes:         h.cnes,
            municipality: h.municipality,
            uf:           h.uf?.uf ?? "",
        }));
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

    // ── Criar combo completo ─────────────────────────────────────────────────────

    async createComboCompleto(dto: CreateComboCompletoDto, companyId: number) {
        let hospitalId: number | null = null;
        if (dto.cnes) {
            const cnesClean = dto.cnes.trim().padStart(7, "0");
            const hospital = await this.hospitalRepo.findOne({ where: { cnes: cnesClean } });
            hospitalId = hospital?.id ?? null;
        }

        const record = this.consultRepo.create({
            companyId,
            hospitalId,
            estabKey:               dto.estabKey               ?? null,
            uf:                     dto.uf                     ?? null,
            municipality:           dto.municipality            ?? null,
            region:                 dto.region                  ?? null,
            ibge:                   dto.ibge                    ?? null,
            cnes:                   dto.cnes                    ?? null,
            establishmentName:      dto.establishmentName       ?? null,
            cnpj:                   dto.cnpj                    ?? null,
            comboType:              dto.comboType               ?? null,
            contract:               dto.contract                ?? null,
            deliveryParcel:         dto.deliveryParcel          ?? null,
            expeditionDate:         dto.expeditionDate          ?? null,
            deliveryForecast:       dto.deliveryForecast        ?? null,
            deliveryDate:           dto.deliveryDate            ?? null,
            installationDate:       dto.installationDate        ?? null,
            trainingDate:           dto.trainingDate            ?? null,
            deliveryStatus:         dto.deliveryStatus          ?? null,
            equipmentCount:         dto.equipmentCount          ?? null,
            notes:                  dto.notes                   ?? null,
            address:                dto.address                 ?? null,
            managerData:            dto.managerData             ?? null,
            managerPhone:           dto.managerPhone            ?? null,
            focalPointData:         dto.focalPointData          ?? null,
            focalPointPhone:        dto.focalPointPhone         ?? null,
            focalPointEmail:        dto.focalPointEmail         ?? null,
            establishmentEmail:     dto.establishmentEmail      ?? null,
            equipmentName:          dto.equipmentName           ?? null,
            equipKey:               dto.equipKey                ?? null,
            comboCode:              dto.comboCode               ?? null,
            serialNumber:           dto.serialNumber            ?? null,
            nfSent:                 dto.nfSent                  ?? null,
            nfNumber:               dto.nfNumber                ?? null,
            nfSentDate:             dto.nfSentDate              ?? null,
            nfValue:                dto.nfValue                 ?? null,
            provisionalReceiptSent: dto.provisionalReceiptSent  ?? null,
            finalReceiptSent:       dto.finalReceiptSent        ?? null,
            payment1Value:          dto.payment1Value           ?? null,
            payment1Nup:            dto.payment1Nup             ?? null,
            payment1SentDate:       dto.payment1SentDate        ?? null,
            payment2Value:          dto.payment2Value           ?? null,
            payment2Nup:            dto.payment2Nup             ?? null,
            payment2SentDate:       dto.payment2SentDate        ?? null,
            payment2Deadline:       dto.payment2Deadline        ?? null,
            totalPaid:              dto.totalPaid               ?? null,
            paymentStatus:          dto.paymentStatus           ?? null,
        });

        const saved = await this.consultRepo.save(record);
        const full  = await this.consultRepo.findOne({ where: { id: saved.id }, relations: { company: true } });
        return this.mapConsult(full!);
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