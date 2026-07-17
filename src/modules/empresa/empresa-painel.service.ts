import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";
import { Company } from "../company/entities/company.entity";

@Injectable()
export class EmpresaPainelService {
    constructor(
        @InjectRepository(ComboConsult)
        private readonly consultRepo: Repository<ComboConsult>,
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
    ) {}

    async findAdminPainelMinDate(): Promise<{ minDate: string }> {
        const result = await this.consultRepo
            .createQueryBuilder("cc")
            .select("MIN(cc.created_at)", "minDate")
            .where("cc.deleted_at IS NULL")
            .andWhere("cc.company_id IS NOT NULL")
            .getRawOne<{ minDate: string | null }>();
        const minDate = result?.minDate
            ? new Date(result.minDate).toISOString().slice(0, 10)
            : "2020-01-01";
        return { minDate };
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
            id:           c.id,
            name:         c.name,
            cnpj:         c.cnpj,
            tradeName:    c.tradeName,
            abbreviation: c.abbreviation,
            comboGroup:   groupMap.has(c.id)
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
}
