import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComboConsult } from "./entities/combo-consult.entity";
import { Hospital } from "./entities/hospital.entity";
import { CreateComboConsultDto, UpdateComboConsultDto } from "./dto/hospital.dto";
import { CreateComboCompletoDto } from "../empresa/dto/empresa.dto";

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
}
