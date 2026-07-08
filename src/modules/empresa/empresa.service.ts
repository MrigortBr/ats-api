import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboEquipamento } from "../hospital/entities/combo-equipamento.entity";
import { HospitalCombo } from "../hospital/entities/hospital-combo.entity";
import { Hospital } from "../hospital/entities/hospital.entity";
import { Company } from "../company/entities/company.entity";
import { EmpresaProblem } from "./entities/empresa-problem.entity";
import {
    CreateEmpresaProblemDto,
    UpdateEmpresaProblemDto,
    UpdateEmpresaEquipamentoDto,
    UpdateEmpresaContatoDto,
    UpdateAdminEquipamentoDto,
    UpdateAdminContatoDto,
    CreateAdminEquipamentoDto,
    CreateComboCompletoDto,
} from "./dto/empresa.dto";

// Lock sem expiração automática — liberado apenas via DELETE

@Injectable()
export class EmpresaService {
    constructor(
        @InjectRepository(ComboEquipamento)
        private readonly equipRepo: Repository<ComboEquipamento>,
        @InjectRepository(HospitalCombo)
        private readonly comboRepo: Repository<HospitalCombo>,
        @InjectRepository(EmpresaProblem)
        private readonly problemRepo: Repository<EmpresaProblem>,
        @InjectRepository(Hospital)
        private readonly hospitalRepo: Repository<Hospital>,
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
    ) {}

    private isLockActive(e: ComboEquipamento): boolean {
        return !!e.lockedBy;
    }

    private mapEquip(e: ComboEquipamento) {
        const combo   = e.combo;
        const hosp    = combo?.hospital;
        const uf      = hosp?.uf;
        const locked  = this.isLockActive(e);
        return {
            id:                     e.id,
            comboId:                e.comboId,
            comboCode:              e.comboCode,
            equipmentName:          e.equipmentName,
            serialNumber:           e.serialNumber,
            nfSent:                 e.nfSent,
            nfNumber:               e.nfNumber,
            nfSentDate:             e.nfSentDate,
            nfValue:                e.nfValue,
            provisionalReceiptSent: e.provisionalReceiptSent,
            finalReceiptSent:       e.finalReceiptSent,
            payment1Value:          e.payment1Value,
            payment1Nup:            e.payment1Nup,
            payment1SentDate:       e.payment1SentDate,
            payment2Value:          e.payment2Value,
            payment2Nup:            e.payment2Nup,
            payment2SentDate:       e.payment2SentDate,
            payment2Deadline:       e.payment2Deadline,
            totalPaid:              e.totalPaid,
            paymentStatus:          e.paymentStatus,
            // Lock
            lockedBy:               e.lockedBy ?? null,
            lockedAt:               e.lockedAt?.toISOString() ?? null,
            // HospitalCombo
            comboType:              combo?.comboType        ?? "",
            contract:               combo?.contract         ?? null,
            deliveryParcel:         combo?.deliveryParcel   ?? null,
            expeditionDate:         combo?.expeditionDate   ?? null,
            deliveryForecast:       combo?.deliveryForecast ?? null,
            deliveryDate:           combo?.deliveryDate     ?? null,
            installationDate:       combo?.installationDate ?? null,
            trainingDate:           combo?.trainingDate     ?? null,
            deliveryStatus:         combo?.deliveryStatus   ?? null,
            equipmentCount:         combo?.equipmentCount   ?? null,
            notes:                  combo?.notes            ?? null,
            companyName:            combo?.company?.name    ?? null,
            // Contato
            address:                combo?.address          ?? null,
            managerData:            combo?.managerData      ?? null,
            managerPhone:           combo?.managerPhone     ?? null,
            focalPointData:         combo?.focalPointData   ?? null,
            focalPointPhone:        combo?.focalPointPhone  ?? null,
            focalPointEmail:        combo?.focalPointEmail  ?? null,
            establishmentEmail:     combo?.establishmentEmail ?? null,
            // Hospital
            hospitalName:           hosp?.name              ?? "",
            cnes:                   hosp?.cnes              ?? null,
            cnpj:                   hosp?.cnpj              ?? null,
            municipality:           hosp?.municipality      ?? "",
            uf:                     uf?.uf                  ?? "",
            region:                 null,
            ibge7:                  hosp?.ibgeCode          ?? null,
        };
    }

    async findRelatorio(companyId: number) {
        const rows = await this.equipRepo.find({
            where: { combo: { companyId } },
            relations: { combo: { hospital: { uf: true }, company: true } },
            order: {
                combo: { hospital: { uf: { uf: "ASC" }, name: "ASC" } },
                id: "ASC",
            },
        });
        return rows.map((e) => this.mapEquip(e));
    }

    async findContatos(companyId: number) {
        return this.comboRepo.find({
            where: { companyId },
            relations: { hospital: { uf: true } },
            select: {
                id: true,
                comboType: true,
                address: true,
                managerData: true,
                managerPhone: true,
                focalPointData: true,
                focalPointPhone: true,
                focalPointEmail: true,
                establishmentEmail: true,
                hospital: {
                    id: true,
                    name: true,
                    cnes: true,
                    cnpj: true,
                    municipality: true,
                    uf: { id: true, uf: true },
                },
            },
            order: { hospital: { uf: { uf: "ASC" }, name: "ASC" } },
        });
    }

    async updateEquipamento(id: number, dto: UpdateEmpresaEquipamentoDto, companyId: number) {
        const equip = await this.equipRepo.findOne({
            where: { id },
            relations: { combo: true },
        });
        if (!equip || equip.combo.companyId !== companyId) {
            throw new NotFoundException(`Equipamento ${id} nao encontrado`);
        }
        const allowed: (keyof UpdateEmpresaEquipamentoDto)[] = [
            "serialNumber", "nfSent", "nfNumber", "nfSentDate",
            "nfValue", "provisionalReceiptSent", "finalReceiptSent",
        ];
        for (const key of allowed) {
            if (key in dto) (equip as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.equipRepo.save(equip);
    }

    async updateContato(comboId: number, dto: UpdateEmpresaContatoDto, companyId: number) {
        const combo = await this.comboRepo.findOne({ where: { id: comboId, companyId } });
        if (!combo) throw new NotFoundException(`Combo ${comboId} nao encontrado`);
        const allowed: (keyof UpdateEmpresaContatoDto)[] = [
            "installationDate", "trainingDate", "deliveryStatus", "notes",
            "address", "managerData", "managerPhone",
            "focalPointData", "focalPointPhone", "focalPointEmail", "establishmentEmail",
        ];
        for (const key of allowed) {
            if (key in dto) (combo as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.comboRepo.save(combo);
    }

    // Admin: sem restricao de empresa --------------------------------------------

    async updateAdminEquipamento(id: number, dto: UpdateAdminEquipamentoDto) {
        const equip = await this.equipRepo.findOne({ where: { id } });
        if (!equip) throw new NotFoundException(`Equipamento ${id} nao encontrado`);
        const allowed: (keyof UpdateAdminEquipamentoDto)[] = [
            "serialNumber", "nfSent", "nfNumber", "nfSentDate",
            "nfValue", "provisionalReceiptSent", "finalReceiptSent",
            "payment1Value", "payment1Nup", "payment1SentDate",
            "payment2Value", "payment2Nup", "payment2SentDate",
            "payment2Deadline", "totalPaid", "paymentStatus",
        ];
        for (const key of allowed) {
            if (key in dto) (equip as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.equipRepo.save(equip);
    }

    async updateAdminContato(comboId: number, dto: UpdateAdminContatoDto) {
        const combo = await this.comboRepo.findOne({ where: { id: comboId } });
        if (!combo) throw new NotFoundException(`Combo ${comboId} nao encontrado`);
        const allowed: (keyof UpdateAdminContatoDto)[] = [
            "installationDate", "trainingDate", "deliveryStatus", "notes",
            "contract", "deliveryParcel", "expeditionDate", "deliveryForecast", "deliveryDate",
            "equipmentCount",
            "address", "managerData", "managerPhone",
            "focalPointData", "focalPointPhone", "focalPointEmail", "establishmentEmail",
        ];
        for (const key of allowed) {
            if (key in dto) (combo as unknown as Record<string, unknown>)[key] = dto[key] ?? null;
        }
        return this.comboRepo.save(combo);
    }

    // Lock / Unlock --------------------------------------------------------------

    async lockEquipamento(id: number, userEmail: string): Promise<{ lockedBy: string; lockedAt: Date }> {
        const equip = await this.equipRepo.findOne({ where: { id } });
        if (!equip) throw new NotFoundException(`Equipamento ${id} nao encontrado`);

        const now = new Date();

        if (this.isLockActive(equip) && equip.lockedBy !== userEmail) {
            throw new ConflictException({
                message: `Linha em edicao por ${equip.lockedBy}`,
                lockedBy: equip.lockedBy,
                lockedAt: equip.lockedAt,
            });
        }

        equip.lockedBy = userEmail;
        equip.lockedAt = now;
        await this.equipRepo.save(equip);
        return { lockedBy: userEmail, lockedAt: now };
    }

    async unlockEquipamento(id: number, userEmail: string): Promise<void> {
        const equip = await this.equipRepo.findOne({ where: { id } });
        if (!equip) return;
        if (equip.lockedBy === userEmail) {
            equip.lockedBy = null;
            equip.lockedAt = null;
            await this.equipRepo.save(equip);
        }
    }

    async findProblemas(companyId: number) {
        return this.problemRepo.find({
            where: { combo: { companyId } },
            relations: { combo: { hospital: { uf: true } } },
            order: { createdAt: "DESC" },
        });
    }

    async createProblem(dto: CreateEmpresaProblemDto, companyId: number) {
        const combo = await this.comboRepo.findOne({
            where: { id: dto.comboId, companyId },
        });
        if (!combo) throw new NotFoundException(`Combo ${dto.comboId} nao encontrado para esta empresa`);
        const problem = this.problemRepo.create({
            comboId: dto.comboId,
            queixa: dto.queixa ?? null,
            motivoUnidade: dto.motivoUnidade ?? null,
            propostaSolucaoMs: dto.propostaSolucaoMs ?? null,
            status: dto.status ?? null,
        });
        return this.problemRepo.save(problem);
    }

    async updateProblem(id: number, dto: UpdateEmpresaProblemDto, companyId: number) {
        const problem = await this.problemRepo.findOne({
            where: { id },
            relations: { combo: true },
        });
        if (!problem || problem.combo.companyId !== companyId) {
            throw new NotFoundException(`Problema ${id} nao encontrado`);
        }
        Object.assign(problem, {
            queixa:            dto.queixa            ?? problem.queixa,
            motivoUnidade:     dto.motivoUnidade     ?? problem.motivoUnidade,
            propostaSolucaoMs: dto.propostaSolucaoMs ?? problem.propostaSolucaoMs,
            status:            dto.status            ?? problem.status,
        });
        return this.problemRepo.save(problem);
    }

    async deleteProblem(id: number, companyId: number) {
        const problem = await this.problemRepo.findOne({
            where: { id },
            relations: { combo: true },
        });
        if (!problem || problem.combo.companyId !== companyId) {
            throw new NotFoundException(`Problema ${id} nao encontrado`);
        }
        await this.problemRepo.softDelete(id);
    }

    async findAdminCompanies() {
        const companies = await this.companyRepo
            .createQueryBuilder("c")
            .select(["c.id", "c.name", "c.cnpj"])
            .where("c.deletedAt IS NULL")
            .orderBy("c.name", "ASC")
            .getMany();

        if (companies.length === 0) return [];

        const rows = await this.comboRepo
            .createQueryBuilder("hc")
            .select("hc.companyId", "companyId")
            .addSelect("MIN(hc.comboType)", "comboType")
            .where("hc.companyId IN (:...ids)", { ids: companies.map((c) => c.id) })
            .andWhere("hc.deletedAt IS NULL")
            .groupBy("hc.companyId")
            .getRawMany<{ companyId: number; comboType: string }>();

        const groupMap = new Map(rows.map((r) => [Number(r.companyId), r.comboType]));

        return companies.map((c) => ({
            id: c.id,
            name: c.name,
            cnpj: c.cnpj,
            comboGroup: groupMap.has(c.id)
                ? (groupMap.get(c.id)!.includes("OFTALMO") ? "OFTALMO" : "CIRURGIA")
                : null,
        }));
    }

    async addEmpresaEquipamento(dto: CreateAdminEquipamentoDto, companyId: number) {
        const combo = await this.comboRepo.findOne({
            where: { id: dto.comboId, companyId },
            relations: { hospital: { uf: true }, company: true },
        });
        if (!combo) throw new NotFoundException(`Combo ${dto.comboId} nao encontrado`);
        const equip = this.equipRepo.create({
            comboId:                dto.comboId,
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
        const saved = await this.equipRepo.save(equip);
        const full = await this.equipRepo.findOne({
            where: { id: saved.id },
            relations: { combo: { hospital: { uf: true }, company: true } },
        });
        return this.mapEquip(full!);
    }

    async createAdminEquipamento(dto: CreateAdminEquipamentoDto) {
        const combo = await this.comboRepo.findOne({
            where: { id: dto.comboId },
            relations: { hospital: { uf: true }, company: true },
        });
        if (!combo) throw new NotFoundException(`Combo ${dto.comboId} nao encontrado`);
        const equip = this.equipRepo.create({
            comboId:               dto.comboId,
            equipmentName:         dto.equipmentName,
            comboCode:             dto.comboCode             ?? null,
            serialNumber:          dto.serialNumber          ?? null,
            nfSent:                dto.nfSent                ?? null,
            nfNumber:              dto.nfNumber              ?? null,
            nfSentDate:            dto.nfSentDate            ?? null,
            nfValue:               dto.nfValue               ?? null,
            provisionalReceiptSent: dto.provisionalReceiptSent ?? null,
            finalReceiptSent:      dto.finalReceiptSent      ?? null,
            payment1Value:         dto.payment1Value         ?? null,
            payment1Nup:           dto.payment1Nup           ?? null,
            payment1SentDate:      dto.payment1SentDate      ?? null,
            payment2Value:         dto.payment2Value         ?? null,
            payment2Nup:           dto.payment2Nup           ?? null,
            payment2SentDate:      dto.payment2SentDate      ?? null,
            payment2Deadline:      dto.payment2Deadline      ?? null,
            totalPaid:             dto.totalPaid             ?? null,
            paymentStatus:         dto.paymentStatus         ?? null,
        });
        const saved = await this.equipRepo.save(equip);
        // update combo fields if provided
        if (dto.contract !== undefined || dto.deliveryParcel !== undefined) {
            if (dto.contract      !== undefined) combo.contract      = dto.contract      ?? null;
            if (dto.deliveryParcel !== undefined) combo.deliveryParcel = dto.deliveryParcel ?? null;
            await this.comboRepo.save(combo);
        }
        // reload com relations para mapEquip
        const full = await this.equipRepo.findOne({
            where: { id: saved.id },
            relations: { combo: { hospital: { uf: true }, company: true } },
        });
        return this.mapEquip(full!);
    }

    async findAdminRelatorio(companyId: number) {
        const rows = await this.equipRepo.find({
            where: { combo: { companyId } },
            relations: { combo: { hospital: { uf: true }, company: true } },
            order: { combo: { hospital: { uf: { uf: "ASC" }, name: "ASC" } }, id: "ASC" },
        });
        return rows.map((e) => this.mapEquip(e));
    }

    findAdminContatos(companyId: number) {
        return this.comboRepo.find({
            where: { companyId },
            relations: { hospital: { uf: true } },
            select: {
                id: true, comboType: true, address: true,
                managerData: true, managerPhone: true,
                focalPointData: true, focalPointPhone: true,
                focalPointEmail: true, establishmentEmail: true,
                hospital: { id: true, name: true, cnes: true, cnpj: true, municipality: true, uf: { id: true, uf: true } },
            },
            order: { hospital: { uf: { uf: "ASC" }, name: "ASC" } },
        });
    }

    findAdminProblemas(companyId: number) {
        return this.problemRepo.find({
            where: { combo: { companyId } },
            relations: { combo: { hospital: { uf: true } } },
            order: { createdAt: "DESC" },
        });
    }

    async findAdminPainel() {
        const DELIVERED = new Set(["Entregue", "Instalado"]);

        const rows = await this.comboRepo
            .createQueryBuilder("hc")
            .leftJoin("hc.company", "c")
            .select("hc.comboType",         "combo_type")
            .addSelect("hc.deliveryStatus",  "delivery_status")
            .addSelect("COALESCE(hc.equipmentCount, 0)", "equipment_count")
            .addSelect("c.id",               "company_id")
            .addSelect("c.name",             "company_name")
            .where("hc.deletedAt IS NULL")
            .andWhere("hc.company_id IS NOT NULL")
            .getRawMany<{
                combo_type:       string | null;
                delivery_status:  string | null;
                equipment_count:  string;
                company_id:       string | null;
                company_name:     string | null;
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
                const c = byComp.get(r.company_id) ?? { name: r.company_name ?? "", group, total: 0, delivered: 0 };
                c.total += equip;
                if (isDelivered) c.delivered += equip;
                byComp.set(r.company_id, c);
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

    // ── ComboCode sugestão ───────────────────────────────────────────────────────

    async suggestComboCode(companyId: number): Promise<string> {
        const company = await this.companyRepo.findOne({ where: { id: companyId } });
        if (!company) throw new NotFoundException(`Empresa ${companyId} nao encontrada`);

        const abbr = company.abbreviation?.toUpperCase()
            ?? company.name.replace(/\s+/g, "").substring(0, 3).toUpperCase();

        // Pega todos os comboCodes que começam com a sigla
        const prefix = `${abbr}_`;
        const existing = await this.equipRepo
            .createQueryBuilder("e")
            .select("e.combo_code", "code")
            .where("e.combo_code LIKE :prefix", { prefix: `${prefix}%` })
            .getRawMany<{ code: string }>();

        const maxNum = existing.reduce((max, r) => {
            const num = parseInt(r.code?.replace(prefix, "") ?? "0", 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);

        return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
    }

    // ── Criar combo completo (hospital_combo + combo_equipamento) ────────────────

    async createComboCompleto(dto: CreateComboCompletoDto, companyId: number) {
        const hospital = await this.hospitalRepo.findOne({ where: { id: dto.hospitalId } });
        if (!hospital) throw new NotFoundException(`Hospital ${dto.hospitalId} nao encontrado`);

        const combo = this.comboRepo.create({
            hospitalId:       dto.hospitalId,
            companyId:        companyId,
            comboType:        dto.comboType,
            contract:         dto.contract         ?? null,
            deliveryParcel:   dto.deliveryParcel   ?? null,
            expeditionDate:   dto.expeditionDate   ?? null,
            deliveryForecast: dto.deliveryForecast ?? null,
            deliveryDate:     dto.deliveryDate     ?? null,
            installationDate: dto.installationDate ?? null,
            trainingDate:     dto.trainingDate     ?? null,
            deliveryStatus:   dto.deliveryStatus   ?? null,
            equipmentCount:   dto.equipmentCount   ?? null,
            notes:            dto.notes            ?? null,
            address:          dto.address          ?? null,
            managerData:      dto.managerData      ?? null,
            managerPhone:     dto.managerPhone     ?? null,
            focalPointData:   dto.focalPointData   ?? null,
            focalPointPhone:  dto.focalPointPhone  ?? null,
            focalPointEmail:  dto.focalPointEmail  ?? null,
            establishmentEmail: dto.establishmentEmail ?? null,
        });
        const savedCombo = await this.comboRepo.save(combo);

        const equip = this.equipRepo.create({
            comboId:                savedCombo.id,
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
        const savedEquip = await this.equipRepo.save(equip);

        const full = await this.equipRepo.findOne({
            where: { id: savedEquip.id },
            relations: { combo: { hospital: { uf: true }, company: true } },
        });
        return this.mapEquip(full!);
    }
}
