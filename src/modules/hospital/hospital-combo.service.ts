import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ComboConsult } from "./entities/combo-consult.entity";
import { Hospital } from "./entities/hospital.entity";
import { CreateComboConsultDto, UpdateComboConsultDto, ImportStatusRowDto } from "./dto/hospital.dto";
import { CreateComboCompletoDto } from "../empresa/dto/empresa.dto";

/** Resultado da correspondência de uma linha da planilha com um registro do banco. */
export interface ImportStatusMatchResult {
    sourceRow: number | null;
    cnes: string;
    equipmentName: string;
    serialNumber: string | null;
    matchedId: number | null;
    establishmentName: string | null;
    currentDeliveryStatus: string | null;
    newDeliveryStatus: string | null;
    currentPaymentStatus: string | null;
    newPaymentStatus: string | null;
    currentNfSent: boolean | null;
    newNfSent: boolean | null;
    changed: boolean;
    changedFields: ("deliveryStatus" | "paymentStatus" | "nfSent")[];
    /** true quando o casamento não veio do CNES+Equipamento(+Série) e sim do pareamento por ordem (opt-in). */
    pairedByOrder: boolean;
    /** true quando o registro do banco não tinha Nº de Série e vamos preenchê-lo com o da planilha ao aplicar. */
    serialBackfilled: boolean;
    reason: string | null;
}

export interface ImportStatusApplyResult {
    total: number;
    updated: number;
    unchanged: number;
    unmatched: number;
    rows: ImportStatusMatchResult[];
}

@Injectable()
export class HospitalComboService {
    constructor(
        @InjectRepository(ComboConsult)
        private readonly consultRepo: Repository<ComboConsult>,
        @InjectRepository(Hospital)
        private readonly hospitalRepo: Repository<Hospital>,
    ) {}

    // ── CREATE ────────────────────────────────────────────────────────────────

    async createCombo(dto: CreateComboConsultDto, companyId?: number | null): Promise<ComboConsult> {
        const cnesClean = dto.cnes ? dto.cnes.trim().padStart(7, "0") : null;
        let hospitalId: number | null = null;

        if (cnesClean) {
            const hospital = await this.hospitalRepo.findOne({ where: { cnes: cnesClean } });
            hospitalId = hospital?.id ?? null;
        }

        let coId: number | null = null;
        if (companyId) coId = companyId;
        else if (dto.companyId) coId = dto.companyId;

        const { cnes: _cnes, companyId: _cid, ...rest } = dto;
        const record = this.consultRepo.create({ ...rest, hospitalId, companyId: coId });
        return this.consultRepo.save(record);
    }

    async createEquipamento(dto: CreateComboConsultDto): Promise<ComboConsult> {
        const { cnes, companyId: cid, ...rest } = dto;
        const cnesClean = cnes ? cnes.trim().padStart(7, "0") : null;
        let hospitalId: number | null = null;
        if (cnesClean) {
            const hospital = await this.hospitalRepo.findOne({ where: { cnes: cnesClean } });
            hospitalId = hospital?.id ?? null;
        }
        const record = this.consultRepo.create({ ...rest, hospitalId, companyId: cid ?? null });
        return this.consultRepo.save(record);
    }

    // ── LIST ──────────────────────────────────────────────────────────────────

    async findAllCombo(companyId?: number | null) {
        const where = companyId ? { companyId } : undefined;
        return this.consultRepo.find({
            where,
            relations: { hospital: { uf: true }, company: true },
            order: { uf: "ASC", establishmentName: "ASC", comboType: "ASC" },
        });
    }

    async findComboByUf(ufSigla: string, companyId?: number | null) {
        const where = companyId
            ? { uf: ufSigla, companyId }
            : { uf: ufSigla };
        return this.consultRepo.find({
            where,
            relations: { hospital: { uf: true }, company: true },
            order: { establishmentName: "ASC", comboType: "ASC" },
        });
    }

    async findAllEquipamentos(companyId?: number | null) {
        const where = companyId ? { companyId } : undefined;
        return this.consultRepo.find({
            where,
            relations: { hospital: { uf: true }, company: true },
            order: { uf: "ASC", establishmentName: "ASC", id: "ASC" },
        });
    }

    async findEquipamentosByCombo(estabKey: string) {
        return this.consultRepo.find({
            where: { estabKey },
            order: { id: "ASC" },
        });
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    async updateCombo(id: number, data: UpdateComboConsultDto): Promise<ComboConsult> {
        const record = await this.consultRepo.findOne({ where: { id } });
        if (!record) throw new NotFoundException(`Registro COMBO ${id} não encontrado`);
        Object.assign(record, data);
        return this.consultRepo.save(record);
    }

    async updateEquipamento(id: number, data: UpdateComboConsultDto): Promise<ComboConsult> {
        const record = await this.consultRepo.findOne({ where: { id } });
        if (!record) throw new NotFoundException(`Equipamento ${id} não encontrado`);
        Object.assign(record, data);
        return this.consultRepo.save(record);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────────────────

    async softDeleteCombo(id: number): Promise<void> {
        const record = await this.consultRepo.findOne({ where: { id } });
        if (!record) throw new NotFoundException(`Registro COMBO ${id} não encontrado`);
        await this.consultRepo.softDelete(id);
    }

    async softDeleteEquipamento(id: number): Promise<void> {
        const record = await this.consultRepo.findOne({ where: { id } });
        if (!record) throw new NotFoundException(`Equipamento ${id} não encontrado`);
        await this.consultRepo.softDelete(id);
    }

    // ── CRIAR COMBO COMPLETO ───────────────────────────────────────────────────

    /** Cria um registro completo de ComboConsult com todos os campos (admin). */
    async createComboCompleto(dto: CreateComboCompletoDto, companyId: number): Promise<ComboConsult> {
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
        return full!;
    }

    // ── IMPORTAÇÃO EM MASSA DE STATUS (planilha externa) ────────────────────────

    /**
     * Casa cada linha da planilha com um registro de ComboConsult existente.
     * Chave: CNES + Equipamento (normalizados). Quando há mais de um equipamento igual no
     * mesmo CNES, desempata pelo Nº de Série (quando informado nos dois lados). Se sobrar
     * ambiguidade (nenhum dos dois lados tem série o suficiente pra decidir) e `allowPositionalPairing`
     * estiver ligado, e a quantidade de candidatos restantes bater exatamente com a quantidade
     * de linhas restantes da planilha para aquele CNES+Equipamento, pareia um a um pela ordem
     * (id do banco × linha da planilha) — só nesse caso exato, pra não arriscar chute com
     * quantidades diferentes. Não persiste nada — só calcula o resultado, usado no preview e no apply.
     */
    private async matchStatusRows(rows: ImportStatusRowDto[], allowPositionalPairing = false): Promise<ImportStatusMatchResult[]> {
        // Agrupa por CNES pra buscar uma vez só por hospital, em vez de 1 query por linha.
        const cnesSet = new Set<string>();
        for (const row of rows) {
            const c = row.cnes?.trim();
            if (c) cnesSet.add(c.padStart(7, "0"));
        }

        const byCnes = new Map<string, ComboConsult[]>();
        const allCandidates = cnesSet.size > 0
            ? await this.consultRepo.find({ where: { cnes: In([...cnesSet]) } })
            : [];
        for (const c of allCandidates) {
            if (!c.cnes) continue;
            const list = byCnes.get(c.cnes) ?? [];
            list.push(c);
            byCnes.set(c.cnes, list);
        }

        // Remove acentos além de normalizar espaço/caixa — a planilha costuma trazer nomes de
        // equipamento acentuados ("ARCO CIRÚRGICO") enquanto o cadastro no sistema usa a versão
        // sem acento ("ARCO CIRURGICO"); sem isso a correspondência falhava por diferença de texto.
        const norm = (s: string | null | undefined) =>
            (s ?? "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toUpperCase()
                .replace(/\s+/g, " ");

        const normSerial = (s: string | null | undefined) => norm(s).replace(/[^A-Z0-9]/g, "");

        interface RowCtx {
            row: ImportStatusRowDto;
            index: number;
            cnesClean: string;
            equipNorm: string;
            serial: string | null;
        }

        const rowCtxs: RowCtx[] = rows.map((row, index) => ({
            row,
            index,
            cnesClean: row.cnes ? row.cnes.trim().padStart(7, "0") : "",
            equipNorm: norm(row.equipmentName),
            serial: row.serialNumber?.trim() || null,
        }));

        const matchFor         = new Map<number, ComboConsult>();
        const reasonFor        = new Map<number, string>();
        const pairedByOrderFor = new Set<number>();

        // Agrupa por CNES+Equipamento — todo o raciocínio de ambiguidade/série/pareamento
        // por ordem só faz sentido comparando linhas que disputam o mesmo grupo de candidatos.
        const groups = new Map<string, RowCtx[]>();
        for (const ctx of rowCtxs) {
            if (!ctx.cnesClean || !ctx.equipNorm) {
                reasonFor.set(ctx.index, "CNES ou equipamento ausente na linha");
                continue;
            }
            const key = `${ctx.cnesClean}||${ctx.equipNorm}`;
            const list = groups.get(key) ?? [];
            list.push(ctx);
            groups.set(key, list);
        }

        for (const group of groups.values()) {
            const cnesClean = group[0].cnesClean;
            const equipNorm = group[0].equipNorm;
            const candidates = byCnes.get(cnesClean) ?? [];
            const byEquip = candidates.filter(c => norm(c.equipmentName) === equipNorm);

            if (byEquip.length === 0) {
                for (const ctx of group) reasonFor.set(ctx.index, "Nenhum equipamento correspondente encontrado para este CNES no sistema");
                continue;
            }

            if (byEquip.length === 1) {
                // Único equipamento com esse nome nesse CNES — não precisa da série pra confirmar.
                for (const ctx of group) matchFor.set(ctx.index, byEquip[0]);
                continue;
            }

            // Mais de um equipamento igual no mesmo CNES: primeiro resolve pela série quem der pra
            // resolver com segurança (série bate uma-pra-uma). O que sobrar (de candidatos e de
            // linhas) só pode ser pareado por ordem se a quantidade for exatamente igual dos dois lados.
            const usedCandidateIds = new Set<number>();
            const unresolved: RowCtx[] = [];

            for (const ctx of group) {
                if (!ctx.serial) { unresolved.push(ctx); continue; }
                const bySerial = byEquip.filter(c => normSerial(c.serialNumber) === normSerial(ctx.serial));
                if (bySerial.length === 1) {
                    matchFor.set(ctx.index, bySerial[0]);
                    usedCandidateIds.add(bySerial[0].id);
                } else {
                    unresolved.push(ctx);
                }
            }

            if (unresolved.length === 0) continue;

            const remainingCandidates = byEquip.filter(c => !usedCandidateIds.has(c.id));

            if (allowPositionalPairing && remainingCandidates.length > 0 && remainingCandidates.length === unresolved.length) {
                const sortedCandidates = [...remainingCandidates].sort((a, b) => a.id - b.id);
                const sortedRows = [...unresolved].sort((a, b) => (a.row.sourceRow ?? 0) - (b.row.sourceRow ?? 0));
                sortedRows.forEach((ctx, i) => {
                    matchFor.set(ctx.index, sortedCandidates[i]);
                    pairedByOrderFor.add(ctx.index);
                });
                continue;
            }

            for (const ctx of unresolved) {
                if (remainingCandidates.length !== unresolved.length) {
                    reasonFor.set(
                        ctx.index,
                        `${byEquip.length} equipamentos iguais neste CNES; a quantidade de candidatos restantes (${remainingCandidates.length}) não bate com a de linhas da planilha (${unresolved.length}) pra parear por ordem — informe o Nº de Série ou ajuste a planilha`,
                    );
                } else if (!allowPositionalPairing) {
                    reasonFor.set(
                        ctx.index,
                        `${byEquip.length} equipamentos iguais neste CNES sem Nº de Série que desempate; marque "parear por ordem" pra casar automaticamente (a quantidade bate) ou informe a série`,
                    );
                } else {
                    reasonFor.set(ctx.index, `${byEquip.length} equipamentos iguais neste CNES — não foi possível desambiguar`);
                }
            }
        }

        const results: ImportStatusMatchResult[] = rowCtxs.map(ctx => {
            const { row } = ctx;
            const match = matchFor.get(ctx.index);
            const reason = reasonFor.get(ctx.index) ?? null;

            const base = {
                sourceRow:     row.sourceRow ?? null,
                cnes:          ctx.cnesClean,
                equipmentName: row.equipmentName,
                serialNumber:  ctx.serial,
            };

            // Cada campo só entra na comparação se a linha da planilha trouxe um valor pra ele.
            const changedFields: ("deliveryStatus" | "paymentStatus" | "nfSent")[] = [];
            const wantsDelivery = row.deliveryStatus != null;
            const wantsPayment  = row.paymentStatus != null;
            const wantsNf       = row.nfSent != null;

            const currentDeliveryStatus = match?.deliveryStatus ?? null;
            const currentPaymentStatus  = match?.paymentStatus ?? null;
            const currentNfSent         = match?.nfSent ?? null;

            if (match && wantsDelivery && norm(currentDeliveryStatus) !== norm(row.deliveryStatus)) changedFields.push("deliveryStatus");
            if (match && wantsPayment && norm(currentPaymentStatus) !== norm(row.paymentStatus)) changedFields.push("paymentStatus");
            if (match && wantsNf && (currentNfSent ?? null) !== (row.nfSent ?? null)) changedFields.push("nfSent");

            const serialBackfilled = !!match && !!ctx.serial && !(match.serialNumber ?? "").trim();

            return {
                ...base,
                matchedId:             match?.id ?? null,
                establishmentName:     match?.establishmentName ?? null,
                currentDeliveryStatus,
                newDeliveryStatus:     wantsDelivery ? (row.deliveryStatus ?? null) : null,
                currentPaymentStatus,
                newPaymentStatus:      wantsPayment ? (row.paymentStatus ?? null) : null,
                currentNfSent,
                newNfSent:             wantsNf ? (row.nfSent ?? null) : null,
                changed:               changedFields.length > 0 || serialBackfilled,
                changedFields,
                pairedByOrder:         pairedByOrderFor.has(ctx.index),
                serialBackfilled,
                reason:                match ? null : reason,
            };
        });

        return results;
    }

    async previewStatusImport(rows: ImportStatusRowDto[], allowPositionalPairing = false): Promise<ImportStatusMatchResult[]> {
        return this.matchStatusRows(rows, allowPositionalPairing);
    }

    async applyStatusImport(rows: ImportStatusRowDto[], allowPositionalPairing = false): Promise<ImportStatusApplyResult> {
        const matches = await this.matchStatusRows(rows, allowPositionalPairing);
        const toUpdate = matches.filter(m => m.matchedId != null && m.changed);

        for (const m of toUpdate) {
            const patch: Partial<ComboConsult> = {};
            if (m.changedFields.includes("deliveryStatus")) patch.deliveryStatus = m.newDeliveryStatus;
            if (m.changedFields.includes("paymentStatus")) patch.paymentStatus = m.newPaymentStatus;
            if (m.changedFields.includes("nfSent")) patch.nfSent = m.newNfSent;
            if (m.serialBackfilled) patch.serialNumber = m.serialNumber;
            await this.consultRepo.update(m.matchedId!, patch);
        }

        return {
            total:     matches.length,
            updated:   toUpdate.length,
            unchanged: matches.filter(m => m.matchedId != null && !m.changed).length,
            unmatched: matches.filter(m => m.matchedId == null).length,
            rows:      matches,
        };
    }
}
