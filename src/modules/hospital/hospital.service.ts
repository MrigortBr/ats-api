import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Hospital } from "./entities/hospital.entity";
import { HospitalTomo } from "./entities/hospital-tomo.entity";
import { HospitalRnm } from "./entities/hospital-rnm.entity";
import { HospitalCombo } from "./entities/hospital-combo.entity";
import { Uf } from "../uf/entities/uf.entity";
import { UpdateHospitalTomoDto, UpdateHospitalRnmDto, UpdateHospitalDto, UpdateHospitalComboDto, CreateHospitalComboDto } from "./dto/hospital.dto";

const DEMAS_BASE = "https://apidadosabertos.saude.gov.br/cnes";
const IBGE_BASE  = "https://servicodados.ibge.gov.br/api/v1/localidades";

interface DemasEstabelecimento {
    codigo_cnes: number;
    nome_razao_social: string;
    nome_fantasia: string | null;
    codigo_municipio: number;
    codigo_uf: number;
}

interface IbgeMunicipio {
    id: number;
    nome: string;
}

// Mapa IBGE codigo_uf → sigla UF
const UF_CODE_MAP: Record<number, string> = {
    11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
    21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
    31: "MG", 32: "ES", 33: "RJ", 35: "SP",
    41: "PR", 42: "SC", 43: "RS",
    50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

function toTitleCase(str: string): string {
    const SKIP = ["de", "da", "do", "das", "dos", "e", "a", "o", "em", "no", "na"];
    return str
        .toLowerCase()
        .split(" ")
        .map((w, i) => (i === 0 || !SKIP.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(" ");
}

@Injectable()
export class HospitalService {
    constructor(
        @InjectRepository(Hospital)
        private readonly hospitalRepo: Repository<Hospital>,
        @InjectRepository(HospitalTomo)
        private readonly tomoRepo: Repository<HospitalTomo>,
        @InjectRepository(HospitalRnm)
        private readonly rnmRepo: Repository<HospitalRnm>,
        @InjectRepository(HospitalCombo)
        private readonly comboRepo: Repository<HospitalCombo>,
        @InjectRepository(Uf)
        private readonly ufRepo: Repository<Uf>,
        private readonly dataSource: DataSource,
    ) {}

    // ── DEMAS API ──────────────────────────────────────────────────────────────

    async fetchCnes(cnes: string): Promise<{ name: string; municipality: string; ufSigla: string; cnes: string }> {
        // CNES é sempre 7 dígitos com zero-padding (ex: 655 → 0000655)
        const cleanCnes = cnes.trim().replace(/\D/g, "").padStart(7, "0");
        if (!cleanCnes || cleanCnes.length !== 7) {
            throw new BadRequestException("CNES inválido — deve ter até 7 dígitos numéricos");
        }

        // Chamada 1 — estabelecimento via DEMAS
        let estab: DemasEstabelecimento;
        try {
            const estabRes = await fetch(`${DEMAS_BASE}/estabelecimentos/${cleanCnes}`, { signal: AbortSignal.timeout(8_000) });
            if (!estabRes.ok) {
                throw new NotFoundException(`CNES ${cleanCnes} não encontrado no DEMAS`);
            }
            const body = await estabRes.json() as DemasEstabelecimento | { estabelecimento?: DemasEstabelecimento; dados?: DemasEstabelecimento[] };
            // A API pode retornar o objeto direto ou embrulhado em { estabelecimento: {...} }
            estab = ("estabelecimento" in body && body.estabelecimento)
                ? body.estabelecimento
                : Array.isArray((body as { dados?: DemasEstabelecimento[] }).dados)
                    ? (body as { dados: DemasEstabelecimento[] }).dados[0]
                    : (body as DemasEstabelecimento);
            if (!estab?.codigo_cnes) {
                throw new NotFoundException(`CNES ${cleanCnes} não encontrado no DEMAS`);
            }
        } catch (err) {
            if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
            const isTimeout = (err as DOMException)?.name === 'TimeoutError';
            throw new InternalServerErrorException(
                isTimeout ? `DEMAS não respondeu em 8s — tente novamente` : `Falha ao consultar DEMAS: ${(err as Error).message ?? "serviço indisponível"}`,
            );
        }

        // UF sigla via mapa local (codigo_uf do DEMAS = código IBGE da UF)
        const ufSigla = UF_CODE_MAP[estab.codigo_uf];
        if (!ufSigla) {
            throw new NotFoundException(`UF com código ${estab.codigo_uf} não reconhecida`);
        }

        // Chamada 2 — município via IBGE (o endpoint do DEMAS para municípios está inoperante)
        // O código CNES do município (6 dígitos) corresponde aos primeiros 6 dígitos do código IBGE (7 dígitos)
        let municipios: IbgeMunicipio[];
        try {
            const munRes = await fetch(`${IBGE_BASE}/estados/${estab.codigo_uf}/municipios`, { signal: AbortSignal.timeout(8_000) });
            if (!munRes.ok) {
                throw new NotFoundException(`Não foi possível buscar municípios da UF ${ufSigla}`);
            }
            municipios = await munRes.json() as IbgeMunicipio[];
        } catch (err) {
            if (err instanceof NotFoundException) throw err;
            const isTimeout = (err as DOMException)?.name === 'TimeoutError';
            throw new InternalServerErrorException(
                isTimeout ? `IBGE não respondeu em 8s — tente novamente` : `Falha ao consultar IBGE: ${(err as Error).message ?? "serviço indisponível"}`,
            );
        }

        const mun = municipios.find(m => String(m.id).startsWith(String(estab.codigo_municipio)));
        if (!mun) {
            throw new NotFoundException(`Município ${estab.codigo_municipio} não encontrado`);
        }

        const rawName = estab.nome_fantasia || estab.nome_razao_social;
        return {
            cnes:         cleanCnes,
            name:         toTitleCase(rawName),
            municipality: toTitleCase(mun.nome),
            ufSigla,
        };
    }

    // ── LOOKUP (sem persistir) ─────────────────────────────────────────────────
    // Verifica se o CNES já existe no banco e em quais módulos (TOMO / RNM).

    async lookup(cnes: string) {
        const external = await this.fetchCnes(cnes);

        const existing = await this.hospitalRepo.findOne({
            where: { cnes: external.cnes },
            relations: { tomo: true, rnm: true },
        });

        return {
            ...external,
            existing: existing
                ? {
                      hospitalId: existing.id,
                      hasTomo: existing.tomo !== null,
                      hasRnm:  existing.rnm  !== null,
                      tomo: existing.tomo ?? null,
                  }
                : null,
        };
    }

    // ── REGISTER FOR MODULE ────────────────────────────────────────────────────
    // Cria o hospital se necessário e adiciona o registro do módulo solicitado.
    // Se o hospital já existir, apenas cria o registro do módulo que ainda faltar.

    async registerForModule(
        cnes: string,
        module: "tomo" | "rnm",
        initialTomo?: UpdateHospitalTomoDto,
    ): Promise<Hospital> {
        const external = await this.fetchCnes(cnes);

        const existing = await this.hospitalRepo.findOne({
            where: { cnes: external.cnes },
            relations: { tomo: true, rnm: true },
        });

        return this.dataSource.transaction(async (em) => {
            let hospitalId: number;

            if (!existing) {
                const uf = await this.ufRepo.findOne({ where: { uf: external.ufSigla } });
                if (!uf) throw new NotFoundException(`UF ${external.ufSigla} não encontrada no banco`);

                const hospital = em.create(Hospital, {
                    ufId: uf.id,
                    name: external.name,
                    municipality: external.municipality,
                    cnes: external.cnes,
                });
                await em.save(hospital);
                hospitalId = hospital.id;
            } else {
                hospitalId = existing.id;
            }

            if (module === "tomo" && !existing?.tomo) {
                await em.save(HospitalTomo, em.create(HospitalTomo, {
                    hospitalId,
                    ...(initialTomo ?? {}),
                }));
            } else if (module === "rnm" && !existing?.rnm) {
                await em.save(HospitalRnm, em.create(HospitalRnm, { hospitalId }));
            }

            return em.findOneOrFail(Hospital, { where: { id: hospitalId } });
        });
    }

    // ── LEGACY create (alias) ──────────────────────────────────────────────────
    async create(cnes: string, initialTomo?: UpdateHospitalTomoDto): Promise<Hospital> {
        return this.registerForModule(cnes, "tomo", initialTomo);
    }

    // ── BULK CREATE ────────────────────────────────────────────────────────────

    async bulkCreate(cnesList: string[]): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
        const created: string[] = [];
        const skipped: string[] = [];
        const errors:  string[] = [];

        const CONCURRENCY = 5;

        for (let i = 0; i < cnesList.length; i += CONCURRENCY) {
            const batch   = cnesList.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(
                batch.map(async (cnes) => {
                    const existing = await this.hospitalRepo.findOne({ where: { cnes } });
                    if (existing) return { status: "skipped" as const, cnes };
                    await this.create(cnes);
                    return { status: "created" as const, cnes };
                }),
            );

            results.forEach((result, j) => {
                const cnes = batch[j];
                if (result.status === "fulfilled") {
                    result.value.status === "created" ? created.push(cnes) : skipped.push(cnes);
                } else {
                    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
                    errors.push(`${cnes}: ${message}`);
                }
            });
        }

        return { created, skipped, errors };
    }

    // ── DELETE HOSPITAL (hard delete — base + todos os vínculos) ─────────────

    async deleteHospital(id: number): Promise<void> {
        const hospital = await this.hospitalRepo.findOne({
            where: { id },
            relations: { tomo: true, rnm: true },
        });
        if (!hospital) throw new NotFoundException(`Hospital ${id} não encontrado`);

        await this.dataSource.transaction(async (em) => {
            if (hospital.tomo) await em.remove(hospital.tomo);
            if (hospital.rnm)  await em.remove(hospital.rnm);
            await em.remove(hospital);
        });
    }

    // ── SOFT DELETE por módulo ────────────────────────────────────────────────

    async softDeleteTomo(id: number): Promise<void> {
        const record = await this.tomoRepo.findOne({ where: { id } });
        if (!record) throw new NotFoundException(`Registro TOMO ${id} não encontrado`);
        await this.tomoRepo.softDelete(id);
    }

    async softDeleteRnm(id: number): Promise<void> {
        const record = await this.rnmRepo.findOne({ where: { id } });
        if (!record) throw new NotFoundException(`Registro RNM ${id} não encontrado`);
        await this.rnmRepo.softDelete(id);
    }

    async softDeleteCombo(id: number): Promise<void> {
        const record = await this.comboRepo.findOne({ where: { id } });
        if (!record) throw new NotFoundException(`Registro COMBO ${id} não encontrado`);
        await this.comboRepo.softDelete(id);
    }

    // ── LIST TOMO ─────────────────────────────────────────────────────────────

    async findAllTomo() {
        return this.tomoRepo.find({
            relations: { hospital: { uf: true } },
            order: { hospital: { uf: { uf: "ASC" }, name: "ASC" } },
        });
    }

    async findTomoByUf(ufSigla: string) {
        return this.tomoRepo.find({
            where: { hospital: { uf: { uf: ufSigla } } },
            relations: { hospital: { uf: true } },
            order: { hospital: { name: "ASC" } },
        });
    }

    // ── LIST RNM ──────────────────────────────────────────────────────────────

    async findAllRnm() {
        return this.rnmRepo.find({
            relations: { hospital: { uf: true } },
            order: { hospital: { uf: { uf: "ASC" }, name: "ASC" } },
        });
    }

    async findRnmByUf(ufSigla: string) {
        return this.rnmRepo.find({
            where: { hospital: { uf: { uf: ufSigla } } },
            relations: { hospital: { uf: true } },
            order: { hospital: { name: "ASC" } },
        });
    }

    // ── UPDATE HOSPITAL ───────────────────────────────────────────────────────

    async updateHospital(id: number, data: UpdateHospitalDto): Promise<Hospital> {
        const hospital = await this.hospitalRepo.findOne({ where: { id } });
        if (!hospital) throw new NotFoundException(`Hospital ${id} não encontrado`);
        if (data.cnes !== undefined) hospital.cnes = data.cnes ?? null;
        if (data.gestao !== undefined) hospital.gestao = data.gestao ?? null;
        if (data.naturezaJuridica !== undefined) hospital.naturezaJuridica = data.naturezaJuridica ?? null;
        return this.hospitalRepo.save(hospital);
    }

    // ── UPDATE TOMO ───────────────────────────────────────────────────────────

    async updateTomo(hospitalId: number, data: UpdateHospitalTomoDto): Promise<HospitalTomo> {
        const record = await this.tomoRepo.findOne({ where: { hospitalId }, relations: { hospital: { uf: true } } });
        if (!record) throw new NotFoundException(`Registro TOMO para hospital ${hospitalId} não encontrado`);

        // Separar campos que pertencem à entidade hospital
        const { cnes, gestao, naturezaJuridica, ...tomoData } = data;
        Object.assign(record, tomoData);

        // Atualizar campos do hospital se fornecidos
        let hospitalChanged = false;
        if (cnes !== undefined) {
            record.hospital.cnes = cnes ? cnes.trim().replace(/\D/g, "").padStart(7, "0") : null;
            hospitalChanged = true;
        }
        if (gestao !== undefined) { record.hospital.gestao = gestao ?? null; hospitalChanged = true; }
        if (naturezaJuridica !== undefined) { record.hospital.naturezaJuridica = naturezaJuridica ?? null; hospitalChanged = true; }
        if (hospitalChanged) await this.hospitalRepo.save(record.hospital);

        return this.tomoRepo.save(record);
    }

    // ── CREATE COMBO ─────────────────────────────────────────────────────────

    async createCombo(dto: CreateHospitalComboDto, companyId?: number | null): Promise<HospitalCombo> {
        const external = await this.fetchCnes(dto.cnes);

        return this.dataSource.transaction(async (em) => {
            let hospital = await em.findOne(Hospital, { where: { cnes: external.cnes } });

            if (!hospital) {
                const uf = await this.ufRepo.findOne({ where: { uf: external.ufSigla } });
                if (!uf) throw new NotFoundException(`UF ${external.ufSigla} não encontrada`);
                hospital = em.create(Hospital, {
                    ufId: uf.id,
                    name: external.name,
                    municipality: external.municipality,
                    cnes: external.cnes,
                });
                await em.save(hospital);
            }

            const { cnes: _cnes, ...comboData } = dto;
            const combo = em.create(HospitalCombo, {
                hospitalId: hospital.id,
                ...comboData,
                companyId: companyId ?? null,
            });
            const saved = await em.save(HospitalCombo, combo);

            return em.findOneOrFail(HospitalCombo, {
                where: { id: saved.id },
                relations: { hospital: { uf: true } },
            });
        });
    }

    // ── LIST COMBO ────────────────────────────────────────────────────────────

    async findAllCombo(companyId?: number | null) {
        return this.comboRepo.find({
            where: companyId ? { companyId } : undefined,
            relations: { hospital: { uf: true } },
            order: { hospital: { uf: { uf: "ASC" }, name: "ASC" }, comboType: "ASC" },
        });
    }

    async findComboByUf(ufSigla: string, companyId?: number | null) {
        return this.comboRepo.find({
            where: companyId
                ? { hospital: { uf: { uf: ufSigla } }, companyId }
                : { hospital: { uf: { uf: ufSigla } } },
            relations: { hospital: { uf: true } },
            order: { hospital: { name: "ASC" }, comboType: "ASC" },
        });
    }

    // ── UPDATE COMBO ──────────────────────────────────────────────────────────

    async updateCombo(id: number, data: UpdateHospitalComboDto): Promise<HospitalCombo> {
        const record = await this.comboRepo.findOne({ where: { id }, relations: { hospital: { uf: true } } });
        if (!record) throw new NotFoundException(`Registro COMBO ${id} não encontrado`);

        const { cnes, cnpj, ...comboData } = data;
        Object.assign(record, comboData);

        let hospitalChanged = false;
        if (cnes !== undefined) {
            record.hospital.cnes = cnes ? cnes.trim().replace(/\D/g, "").padStart(7, "0") : null;
            hospitalChanged = true;
        }
        if (cnpj !== undefined) { record.hospital.cnpj = cnpj ?? null; hospitalChanged = true; }
        if (hospitalChanged) await this.hospitalRepo.save(record.hospital);

        return this.comboRepo.save(record);
    }

    // ── UPDATE RNM ────────────────────────────────────────────────────────────

    async updateRnm(hospitalId: number, data: UpdateHospitalRnmDto): Promise<HospitalRnm> {
        const record = await this.rnmRepo.findOne({ where: { hospitalId }, relations: { hospital: { uf: true } } });
        if (!record) throw new NotFoundException(`Registro RNM para hospital ${hospitalId} não encontrado`);

        const { cnes, gestao, naturezaJuridica, ...rnmData } = data;
        Object.assign(record, rnmData);

        let hospitalChanged = false;
        if (cnes !== undefined) {
            record.hospital.cnes = cnes ? cnes.trim().replace(/\D/g, "").padStart(7, "0") : null;
            hospitalChanged = true;
        }
        if (gestao !== undefined) { record.hospital.gestao = gestao ?? null; hospitalChanged = true; }
        if (naturezaJuridica !== undefined) { record.hospital.naturezaJuridica = naturezaJuridica ?? null; hospitalChanged = true; }
        if (hospitalChanged) await this.hospitalRepo.save(record.hospital);

        return this.rnmRepo.save(record);
    }
}
