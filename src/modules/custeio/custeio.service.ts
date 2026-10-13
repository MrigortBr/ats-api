import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { CusteioResponsavel } from "./entities/custeio-responsavel.entity";
import { CusteioAtendido } from "./entities/custeio-atendido.entity";
import { CusteioMunicipioRef } from "./entities/custeio-municipio-ref.entity";
import { CusteioProjecao } from "./entities/custeio-projecao.entity";
import { CreateCusteioResponsavelDto, SyncCusteioUfDto, UpdateCusteioResponsavelDto } from "./dto/custeio.dto";

export interface CusteioAtendidoView {
    nome: string;
    tag?: string;
    rt: number;
    hd: number;
    distRt: number | null;
    distHd: number | null;
    faixaRt?: string;
    faixaHd?: string;
    /** UF da referência quando o deslocamento é interestadual. */
    refUf?: string;
}

export interface CusteioResponsavelView {
    id: number;
    macrorregiao: string;
    municipio: string;
    gestorHd?: string;
    tipoVeiculo: string;
    tipoVeiculoHd?: string;
    nVeiculos: number | null;
    refRt: string;
    refHd: string;
    atendidos: CusteioAtendidoView[];
    divisao?: { n: number; indice: number };
}

export interface CusteioMunicipioRefView {
    codigoIbge: number;
    nome: string;
    macrorregiao: string;
    /** Pacientes RT sem acompanhantes (60% dos novos casos, arredondado para cima). */
    rt: number;
    distRt: number | null;
    /** Pacientes HD com acompanhantes (10%), arredondado para cima. */
    hd: number;
    distHd: number | null;
    /** Município do serviço de TRS mais próximo (sugestão de referência HD). */
    refHd: string | null;
    habilitadoTrs: boolean;
    emUso: boolean;
}

export interface CusteioProjecaoView {
    macrorregiao: string;
    municipios: string[];
    rt: {
        nAcima50: number | null; pacientes: number | null; pessoas: number | null; viagens: number | null;
        vans: number | null; capVans: number | null; micros: number | null; capMicros: number | null; saldo: number | null;
    };
    hd: {
        nAcima50: number | null; pacientes: number | null; pessoas: number | null; viagens: number | null;
        vans: number | null; capVans: number | null; micros: number | null; capMicros: number | null;
        capTotal: number | null; saldo: number | null;
    };
}

/** Município a mais de 50 km de um serviço (com rota na base) que ainda não aparece no custeio. */
export interface CusteioSemCusteioView {
    codigoIbge: number;
    nome: string;
    macrorregiao: string;
    /** Pacientes RT sem acompanhantes. */
    rt: number;
    /** null = sem rota (ex.: acesso fluvial); nesse caso não gera pendência. */
    distRt: number | null;
    precisaRt: boolean;
    /** Pacientes HD com acompanhantes (10%). */
    hd: number;
    /** Pacientes HD sem acompanhantes (população em TRS, arredondada para cima). */
    hdPacientes: number;
    distHd: number | null;
    precisaHd: boolean;
}

export interface CusteioComparativoView {
    uf: string;
    projecoes: CusteioProjecaoView[];
    semCusteio: CusteioSemCusteioView[];
}

export interface CusteioUfView {
    uf: string;
    responsaveis: CusteioResponsavelView[];
}

/** Pacientes HD com acompanhantes: população em TRS + 10%, arredondada para cima. */
export function hdComAcompanhantes(popTrs: number): number {
    return Math.ceil(popTrs * 1.1);
}

/** Chave de comparação de nomes: sem acento, caixa ou espaços extras. */
export function chaveNome(n: string): string {
    return n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function toView(r: CusteioResponsavel): CusteioResponsavelView {
    const atendidos = [...(r.atendidos ?? [])].sort((a, b) => a.ordem - b.ordem || a.id - b.id);
    return {
        id: r.id,
        macrorregiao: r.macrorregiao,
        municipio: r.municipio,
        ...(r.gestorHd ? { gestorHd: r.gestorHd } : {}),
        tipoVeiculo: r.tipoVeiculo ?? "",
        ...(r.tipoVeiculoHd ? { tipoVeiculoHd: r.tipoVeiculoHd } : {}),
        nVeiculos: r.nVeiculos,
        refRt: r.refRt ?? "",
        refHd: r.refHd ?? "",
        atendidos: atendidos.map((a) => ({
            nome: a.nome,
            ...(a.tag ? { tag: a.tag } : {}),
            rt: a.rt,
            hd: a.hd,
            distRt: a.distRt,
            distHd: a.distHd,
            ...(a.faixaRt ? { faixaRt: a.faixaRt } : {}),
            ...(a.faixaHd ? { faixaHd: a.faixaHd } : {}),
            ...(a.refUf ? { refUf: a.refUf } : {}),
        })),
        ...(r.divisaoN !== null && r.divisaoIndice !== null
            ? { divisao: { n: r.divisaoN, indice: r.divisaoIndice } }
            : {}),
    };
}

@Injectable()
export class CusteioService {
    constructor(
        @InjectRepository(CusteioResponsavel) private readonly responsaveis: Repository<CusteioResponsavel>,
        @InjectRepository(CusteioMunicipioRef) private readonly refs: Repository<CusteioMunicipioRef>,
        @InjectRepository(CusteioProjecao) private readonly projecoes: Repository<CusteioProjecao>,
        private readonly dataSource: DataSource,
    ) {}

    async municipiosPorUf(uf: string): Promise<CusteioMunicipioRefView[]> {
        if (!/^[A-Z]{2}$/.test(uf)) throw new BadRequestException("UF inválida");
        const [lista, emUso] = await Promise.all([
            this.refs.find({ where: { uf }, order: { municipio: "ASC" } }),
            this.nomesEmUso(uf),
        ]);
        return lista.map((m) => ({
            codigoIbge: m.codigoIbge,
            nome: m.municipio,
            macrorregiao: m.macrorregiao,
            rt: Math.ceil(m.novosCasosRt),
            distRt: m.distRt,
            hd: hdComAcompanhantes(m.popTrs),
            distHd: m.distHd,
            refHd: m.munProxHd,
            habilitadoTrs: m.habilitadoTrs,
            emUso: emUso.has(chaveNome(m.municipio)),
        }));
    }

    /** Projeção importada da UF e os municípios a mais de 50 km (ou sem rota) de um serviço que não estão em nenhum custeio. */
    async comparativo(uf: string): Promise<CusteioComparativoView> {
        if (!/^[A-Z]{2}$/.test(uf)) throw new BadRequestException("UF inválida");
        const [proj, lista, emUso] = await Promise.all([
            this.projecoes.find({ where: { uf }, order: { ordem: "ASC" } }),
            this.refs.find({ where: { uf }, order: { municipio: "ASC" } }),
            this.nomesEmUso(uf),
        ]);
        // "Manicoré (Matupi)" também conta como Manicoré.
        for (const n of [...emUso]) emUso.add(n.replace(/\s*\(.*$/, "").trim());
        const macroDe = new Map<string, string>();
        for (const p of proj) for (const m of p.municipios) macroDe.set(chaveNome(m), p.macrorregiao);

        const semCusteio: CusteioSemCusteioView[] = [];
        for (const m of lista) {
            if (emUso.has(chaveNome(m.municipio))) continue;
            const rt = Math.ceil(m.novosCasosRt);
            const hd = hdComAcompanhantes(m.popTrs);
            const precisaRt = rt > 0 && m.distRt !== null && m.distRt > 50;
            const precisaHd = hd > 0 && m.distHd !== null && m.distHd > 50;
            if (!precisaRt && !precisaHd) continue;
            semCusteio.push({
                codigoIbge: m.codigoIbge,
                nome: m.municipio,
                macrorregiao: macroDe.get(chaveNome(m.municipio)) ?? m.macrorregiao,
                rt, distRt: m.distRt, precisaRt,
                hd, hdPacientes: Math.ceil(m.popTrs), distHd: m.distHd, precisaHd,
            });
        }

        return {
            uf,
            projecoes: proj.map((p) => ({
                macrorregiao: p.macrorregiao,
                municipios: p.municipios,
                rt: {
                    nAcima50: p.rtNAcima50, pacientes: p.rtPacientes, pessoas: p.rtPessoas, viagens: p.rtViagens,
                    vans: p.rtVans, capVans: p.rtCapVans, micros: p.rtMicros, capMicros: p.rtCapMicros, saldo: p.rtSaldo,
                },
                hd: {
                    nAcima50: p.hdNAcima50, pacientes: p.hdPacientes, pessoas: p.hdPessoas, viagens: p.hdViagens,
                    vans: p.hdVans, capVans: p.hdCapVans, micros: p.hdMicros, capMicros: p.hdCapMicros,
                    capTotal: p.hdCapTotal, saldo: p.hdSaldo,
                },
            })),
            semCusteio,
        };
    }

    private async nomesEmUso(uf: string): Promise<Set<string>> {
        const linhas: { nome: string }[] = await this.dataSource
            .getRepository(CusteioAtendido)
            .createQueryBuilder("a")
            .innerJoin("a.responsavel", "r")
            .where("r.uf = :uf", { uf })
            .select("a.nome", "nome")
            .getRawMany();
        return new Set(linhas.map((l) => chaveNome(l.nome)));
    }

    /** Cria um responsável; macrorregião, pacientes RT e km vêm da base de referência (nunca do cliente). */
    async createResponsavel(dto: CreateCusteioResponsavelDto): Promise<CusteioResponsavelView> {
        const uf = dto.uf.toUpperCase();
        const codigos = [...new Set(dto.atendidos.map((a) => a.codigoIbge))];
        if (codigos.length !== dto.atendidos.length) throw new BadRequestException("Município atendido repetido");

        const encontrados = await this.refs.find({ where: { codigoIbge: In(codigos) } });
        const porCodigo = new Map(encontrados.map((m) => [m.codigoIbge, m]));
        const ordenados = codigos.map((c) => porCodigo.get(c));
        if (ordenados.some((m) => !m || m.uf !== uf)) {
            throw new BadRequestException("Município atendido não pertence à UF informada");
        }
        const atendidosRef = ordenados as CusteioMunicipioRef[];

        const emUso = await this.nomesEmUso(uf);
        const jaExistem = atendidosRef.filter((m) => emUso.has(chaveNome(m.municipio))).map((m) => m.municipio);
        if (jaExistem.length > 0) {
            throw new ConflictException(`Já estão em outro custeio: ${jaExistem.join(", ")}`);
        }

        const texto = (v: string | null | undefined): string | null => v?.trim() || null;
        const gestor = dto.municipio.trim();
        const gestorRef = await this.refs
            .createQueryBuilder("m")
            .where("m.uf = :uf AND lower(m.municipio) = lower(:nome)", { uf, nome: gestor })
            .getOne();
        const macrorregiao = (gestorRef ?? atendidosRef[0]).macrorregiao;

        const id = await this.dataSource.transaction(async (manager) => {
            const respRepo = manager.getRepository(CusteioResponsavel);
            const { max } = (await respRepo
                .createQueryBuilder("r")
                .select("COALESCE(MAX(r.ordem), -1)", "max")
                .where("r.uf = :uf", { uf })
                .getRawOne<{ max: number }>()) ?? { max: -1 };

            const novo = await respRepo.save(
                respRepo.create({
                    uf,
                    ordem: Number(max) + 1,
                    macrorregiao,
                    municipio: gestor,
                    gestorHd: texto(dto.gestorHd),
                    tipoVeiculo: texto(dto.tipoVeiculo),
                    tipoVeiculoHd: null,
                    nVeiculos: null,
                    refRt: texto(dto.refRt),
                    refHd: texto(dto.refHd),
                    divisaoN: null,
                    divisaoIndice: null,
                }),
            );
            await manager.getRepository(CusteioAtendido).save(
                atendidosRef.map((m, i) =>
                    manager.getRepository(CusteioAtendido).create({
                        responsavelId: novo.id,
                        ordem: i,
                        nome: m.municipio,
                        tag: null,
                        rt: Math.ceil(m.novosCasosRt),
                        hd: hdComAcompanhantes(m.popTrs),
                        distRt: m.distRt,
                        distHd: m.distHd,
                        faixaRt: null,
                        faixaHd: null,
                    }),
                ),
            );
            return novo.id;
        });

        const salvo = await this.responsaveis.findOneOrFail({ where: { id }, relations: { atendidos: true } });
        return toView(salvo);
    }

    async ufsComCusteio(): Promise<string[]> {
        const linhas: { uf: string }[] = await this.responsaveis
            .createQueryBuilder("r")
            .select("DISTINCT r.uf", "uf")
            .orderBy("r.uf", "ASC")
            .getRawMany();
        return linhas.map((l) => l.uf);
    }

    async findByUf(uf: string): Promise<CusteioUfView> {
        const lista = await this.responsaveis.find({
            where: { uf },
            relations: { atendidos: true },
            order: { ordem: "ASC", id: "ASC" },
        });
        return { uf, responsaveis: lista.map(toView) };
    }

    /**
     * Grava o estado final da UF. Responsáveis com id são atualizados (preservando gestorHd, tipoVeiculoHd,
     * nVeiculos e divisão), os sem id são criados e os ausentes são removidos. Linhas com codigoIbge
     * têm nome, pacientes RT e km obtidos da base de referência quando não enviados.
     */
    async syncUf(uf: string, dto: SyncCusteioUfDto): Promise<CusteioUfView> {
        if (!/^[A-Z]{2}$/.test(uf)) throw new BadRequestException("UF inválida");
        const texto = (v: string | null | undefined): string | null => v?.trim() || null;

        const codigos = [...new Set(dto.responsaveis.flatMap((r) => r.atendidos.map((a) => a.codigoIbge)).filter((c): c is number => c !== undefined))];
        const refs = codigos.length ? await this.refs.find({ where: { codigoIbge: In(codigos) } }) : [];
        const refPorCodigo = new Map(refs.map((m) => [m.codigoIbge, m]));
        const refsUf = await this.refs.find({ where: { uf } });
        const refPorNome = new Map(refsUf.map((m) => [chaveNome(m.municipio), m]));

        const ids = dto.responsaveis.map((r) => r.id).filter((i): i is number => i !== undefined);
        if (new Set(ids).size !== ids.length) throw new BadRequestException("Responsável repetido");

        await this.dataSource.transaction(async (manager) => {
            const respRepo = manager.getRepository(CusteioResponsavel);
            const atendRepo = manager.getRepository(CusteioAtendido);
            const existentes = await respRepo.find({ where: { uf }, relations: { atendidos: true } });
            const porId = new Map(existentes.map((r) => [r.id, r]));
            if (ids.some((i) => !porId.has(i))) throw new BadRequestException("Responsável não pertence à UF informada");

            // Município novo (da base) repetido em outro custeio só é aceito quando há divisão de custo.
            const contagem = new Map<string, number>();
            for (const r of dto.responsaveis) {
                for (const a of r.atendidos) {
                    const nome = a.codigoIbge !== undefined ? refPorCodigo.get(a.codigoIbge)?.municipio : a.nome;
                    if (nome) contagem.set(chaveNome(nome), (contagem.get(chaveNome(nome)) ?? 0) + 1);
                }
            }

            const manter = new Set(ids);
            const remover = existentes.filter((r) => !manter.has(r.id));
            if (remover.length) await respRepo.remove(remover);

            for (let i = 0; i < dto.responsaveis.length; i++) {
                const r = dto.responsaveis[i];
                const atual = r.id !== undefined ? porId.get(r.id)! : null;
                const nomesNoResp = new Set<string>();

                const linhas = r.atendidos.map((a, j) => {
                    let nome = a.nome?.trim() ?? "";
                    let rt = a.rt;
                    let distRt = a.distRt;
                    let hd = a.hd;
                    let distHd = a.distHd;
                    if (a.codigoIbge !== undefined) {
                        const ref = refPorCodigo.get(a.codigoIbge);
                        if (!ref || ref.uf !== uf) throw new BadRequestException("Município atendido não pertence à UF informada");
                        nome = ref.municipio;
                        rt ??= Math.ceil(ref.novosCasosRt);
                        if (distRt === undefined) distRt = ref.distRt;
                        hd ??= hdComAcompanhantes(ref.popTrs);
                        if (distHd === undefined) distHd = ref.distHd;
                        const k = chaveNome(nome);
                        if ((contagem.get(k) ?? 0) > 1 && !atual?.divisaoN && !this.temDivisao(dto, porId, k, refPorCodigo)) {
                            throw new ConflictException(`${nome} aparece em mais de um custeio`);
                        }
                    }
                    if (nome === "") throw new BadRequestException("Município atendido sem nome");
                    const k = chaveNome(nome);
                    if (nomesNoResp.has(k)) throw new BadRequestException(`${nome} repetido no mesmo custeio`);
                    nomesNoResp.add(k);
                    return { ordem: j, nome, a, rt: rt ?? 0, distRt: distRt ?? null, hd: hd ?? 0, distHd: distHd ?? null };
                });

                const gestorRef = refPorNome.get(chaveNome(r.municipio));
                const primeiraRef = linhas.map((l) => refPorNome.get(chaveNome(l.nome))).find(Boolean);
                const macrorregiao = gestorRef?.macrorregiao || primeiraRef?.macrorregiao || atual?.macrorregiao || "";

                let resp: CusteioResponsavel;
                if (atual) {
                    atual.ordem = i;
                    atual.macrorregiao = macrorregiao || atual.macrorregiao;
                    atual.municipio = r.municipio.trim();
                    atual.tipoVeiculo = texto(r.tipoVeiculo);
                    atual.refRt = texto(r.refRt);
                    atual.refHd = texto(r.refHd);
                    const antigos = atual.atendidos;
                    atual.atendidos = [];
                    resp = await respRepo.save(atual);
                    if (antigos.length) await atendRepo.remove(antigos);
                } else {
                    resp = await respRepo.save(
                        respRepo.create({
                            uf, ordem: i, macrorregiao, municipio: r.municipio.trim(),
                            gestorHd: null, tipoVeiculo: texto(r.tipoVeiculo), tipoVeiculoHd: null, nVeiculos: null,
                            refRt: texto(r.refRt), refHd: texto(r.refHd), divisaoN: null, divisaoIndice: null,
                        }),
                    );
                }

                await atendRepo.save(
                    linhas.map((l) =>
                        atendRepo.create({
                            responsavelId: resp.id,
                            ordem: l.ordem,
                            nome: l.nome,
                            tag: texto(l.a.tag),
                            rt: l.rt,
                            hd: l.hd,
                            distRt: l.distRt,
                            distHd: l.distHd,
                            faixaRt: texto(l.a.faixaRt),
                            faixaHd: texto(l.a.faixaHd),
                            refUf: this.refUf(l.a.refUf, uf),
                        }),
                    ),
                );
            }
        });

        return this.findByUf(uf);
    }

    /** Normaliza a UF da referência: vazia ou igual à UF do custeio = nulo (mesma UF). */
    private refUf(v: string | null | undefined, ufCusteio: string): string | null {
        const uf = v?.trim().toUpperCase();
        if (!uf) return null;
        if (!/^[A-Z]{2}$/.test(uf)) throw new BadRequestException("UF da referência inválida");
        return uf === ufCusteio ? null : uf;
    }

    /** Alguma das ocorrências do município está num responsável existente com divisão de custo. */
    private temDivisao(
        dto: SyncCusteioUfDto,
        porId: Map<number, CusteioResponsavel>,
        chave: string,
        refPorCodigo: Map<number, CusteioMunicipioRef>,
    ): boolean {
        return dto.responsaveis.some((r) => {
            const ex = r.id !== undefined ? porId.get(r.id) : undefined;
            if (!ex || ex.divisaoN === null) return false;
            return r.atendidos.some((a) => {
                const nome = a.codigoIbge !== undefined ? refPorCodigo.get(a.codigoIbge)?.municipio : a.nome;
                return nome !== undefined && chaveNome(nome) === chave;
            });
        });
    }

    async updateResponsavel(id: number, dto: UpdateCusteioResponsavelDto): Promise<CusteioResponsavelView> {
        await this.dataSource.transaction(async (manager) => {
            const respRepo = manager.getRepository(CusteioResponsavel);
            const atendRepo = manager.getRepository(CusteioAtendido);

            const atual = await respRepo.findOne({ where: { id }, relations: { atendidos: true } });
            if (!atual) throw new NotFoundException("Responsável de custeio não encontrado");

            const texto = (v: string | null | undefined): string | null => v?.trim() || null;
            atual.municipio = dto.municipio.trim();
            atual.gestorHd = texto(dto.gestorHd);
            atual.tipoVeiculo = texto(dto.tipoVeiculo);
            atual.tipoVeiculoHd = texto(dto.tipoVeiculoHd);
            atual.nVeiculos = dto.nVeiculos ?? null;
            atual.refRt = texto(dto.refRt);
            atual.refHd = texto(dto.refHd);
            const antigos = atual.atendidos;
            atual.atendidos = [];
            await respRepo.save(atual);

            if (antigos.length > 0) await atendRepo.remove(antigos);
            await atendRepo.save(
                dto.atendidos.map((a, i) =>
                    atendRepo.create({
                        responsavelId: id,
                        ordem: i,
                        nome: a.nome.trim(),
                        tag: a.tag?.trim() || null,
                        rt: a.rt,
                        hd: a.hd,
                        distRt: a.distRt ?? null,
                        distHd: a.distHd ?? null,
                        faixaRt: texto(a.faixaRt),
                        faixaHd: texto(a.faixaHd),
                        refUf: this.refUf(a.refUf, atual.uf),
                    }),
                ),
            );
        });

        const salvo = await this.responsaveis.findOneOrFail({ where: { id }, relations: { atendidos: true } });
        return toView(salvo);
    }
}
