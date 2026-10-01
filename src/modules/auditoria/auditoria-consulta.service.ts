import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository, SelectQueryBuilder } from "typeorm";
import { TermoAceite } from "../termo/entities/termo-aceite.entity";
import { AuditoriaEvento, type TipoEvento } from "./entities/auditoria-evento.entity";
import { carregarChaveiro, decifrar, sha256, type Chaveiro } from "../termo/auditoria-cripto";
import {
    aadDoRegistro,
    calcularHashRegistro,
    toIsoWithOffset,
    type DadosAcesso,
} from "../termo/termo-aceite.service";
import { aadDoEvento, calcularHashEvento, type DetalhesEvento } from "./auditoria-eventos.service";
import type { FiltrosAlteracoesDto, FiltrosAuditoriaDto, FiltrosEventosDto } from "./dto/filtros-auditoria.dto";
import { AuditoriaAlteracao, type AcaoDados, type ModuloAuditado } from "./entities/auditoria-alteracao.entity";
import {
    aadDaAlteracao,
    calcularHashAlteracao,
    type DetalhesAlteracao,
} from "./dados/auditoria-alteracoes.service";
import { TERMO_FUSO_EXIBICAO } from "../termo/termo.constants";

const FUSO_OFFSET = "-03:00"; // Brasilia (sem horario de verao desde 2019)
const LOTE_VERIFICACAO = 1000;

export interface Pagina<T> {
    itens: T[];
    total: number;
    pagina: number;
    porPagina: number;
}

/** Resultado de decifrar um registro. */
type Aberto<T> = { ok: true; dados: T; conteudoConfere: boolean } | { ok: false; erro: string };

export interface AceiteAuditoria {
    id: string;
    usuario: { id: number; nome: string; email: string };
    termoVersao: string;
    assinadoEmServidor: string;
    assinadoEmCliente: string;
    /** Navegador - servidor, em segundos (positivo = relogio do navegador adiantado). */
    diferencaRelogioSegundos: number;
    dadosAcesso: DadosAcesso | null;
    integridade: { decifrado: boolean; conteudoConfere: boolean; erro?: string };
    hash: string;
}

export interface EventoAuditoria {
    id: string;
    tipo: TipoEvento;
    usuario: { id: number | null; email: string | null };
    ocorridoEm: string;
    termoAceiteId: string | null;
    detalhes: DetalhesEvento | null;
    integridade: { decifrado: boolean; conteudoConfere: boolean; erro?: string };
    hash: string;
}

export interface AlteracaoAuditoria {
    id: string;
    ocorridoEm: string;
    usuario: { id: number | null; email: string | null };
    modulo: ModuloAuditado;
    acao: AcaoDados;
    metodo: string;
    rota: string;
    registroRef: string | null;
    statusHttp: number;
    sucesso: boolean;
    qtdMudancas: number;
    detalhes: DetalhesAlteracao | null;
    integridade: { decifrado: boolean; conteudoConfere: boolean; erro?: string };
    hash: string;
}

export interface ResultadoCadeia {
    total: number;
    valida: boolean;
    conteudoIlegivel: number;
    primeiroProblema: { id: string; motivo: string } | null;
    ultimoHash: string | null;
}

function intervalo(f: FiltrosAuditoriaDto): { ini?: string; fim?: string } {
    return {
        ini: f.inicio ? `${f.inicio}T00:00:00.000${FUSO_OFFSET}` : undefined,
        fim: f.fim ? `${f.fim}T23:59:59.999${FUSO_OFFSET}` : undefined,
    };
}

function paginacao(f: FiltrosAuditoriaDto) {
    const pagina = f.pagina ?? 1;
    const porPagina = f.porPagina ?? 25;
    return { pagina, porPagina, skip: (pagina - 1) * porPagina };
}

const iso = (d: Date) => toIsoWithOffset(d, TERMO_FUSO_EXIBICAO);

@Injectable()
export class AuditoriaConsultaService {
    private readonly chaveiro: Chaveiro;

    constructor(
        @InjectRepository(TermoAceite)
        private readonly aceites: Repository<TermoAceite>,
        @InjectRepository(AuditoriaEvento)
        private readonly eventos: Repository<AuditoriaEvento>,
        @InjectRepository(AuditoriaAlteracao)
        private readonly alteracoes: Repository<AuditoriaAlteracao>,
    ) {
        this.chaveiro = carregarChaveiro();
    }

    private abrir<T>(cifrado: string, chaveId: string, aad: string, hashEsperado: string): Aberto<T> {
        const chave = this.chaveiro.porId.get(chaveId);
        if (!chave) return { ok: false, erro: `Chave '${chaveId}' nao configurada no servidor` };
        try {
            const json = decifrar(cifrado, chave, aad);
            return { ok: true, dados: JSON.parse(json) as T, conteudoConfere: sha256(json) === hashEsperado };
        } catch {
            return { ok: false, erro: "Conteudo nao pode ser decifrado (chave incorreta ou registro adulterado)" };
        }
    }

    // ── Listagens ─────────────────────────────────────────────────────────────

    async listarAceites(f: FiltrosAuditoriaDto): Promise<Pagina<AceiteAuditoria>> {
        const { pagina, porPagina, skip } = paginacao(f);
        const { ini, fim } = intervalo(f);

        const qb = this.aceites.createQueryBuilder("a");
        if (ini) qb.andWhere("a.assinado_em_servidor >= :ini", { ini });
        if (fim) qb.andWhere("a.assinado_em_servidor <= :fim", { fim });
        this.filtroEmail(qb, "a", f.email);

        const [linhas, total] = await qb.orderBy("a.id", "DESC").skip(skip).take(porPagina).getManyAndCount();

        const itens = linhas.map((a): AceiteAuditoria => {
            const aberto = this.abrir<DadosAcesso>(a.dadosAcessoCifrados, a.criptoChaveId, aadDoRegistro(a), a.dadosAcessoHash);
            return {
                id: a.id,
                usuario: { id: a.userId, nome: a.userNome, email: a.userEmail },
                termoVersao: a.termoVersao,
                assinadoEmServidor: iso(a.assinadoEmServidor),
                assinadoEmCliente: a.assinadoEmClienteTexto,
                diferencaRelogioSegundos: Math.round((a.assinadoEmCliente.getTime() - a.assinadoEmServidor.getTime()) / 1000),
                dadosAcesso: aberto.ok ? aberto.dados : null,
                integridade: aberto.ok
                    ? { decifrado: true, conteudoConfere: aberto.conteudoConfere }
                    : { decifrado: false, conteudoConfere: false, erro: aberto.erro },
                hash: a.hash,
            };
        });
        return { itens, total, pagina, porPagina };
    }

    async listarEventos(f: FiltrosEventosDto): Promise<Pagina<EventoAuditoria>> {
        const { pagina, porPagina, skip } = paginacao(f);
        const { ini, fim } = intervalo(f);

        const qb = this.eventos.createQueryBuilder("e");
        if (ini) qb.andWhere("e.ocorrido_em >= :ini", { ini });
        if (fim) qb.andWhere("e.ocorrido_em <= :fim", { fim });
        if (f.tipo) qb.andWhere("e.tipo = :tipo", { tipo: f.tipo });
        this.filtroEmail(qb, "e", f.email);

        const [linhas, total] = await qb.orderBy("e.id", "DESC").skip(skip).take(porPagina).getManyAndCount();

        const itens = linhas.map((e): EventoAuditoria => {
            const aberto = this.abrir<DetalhesEvento>(e.detalhesCifrados, e.criptoChaveId, aadDoEvento(e), e.detalhesHash);
            return {
                id: e.id,
                tipo: e.tipo,
                usuario: { id: e.userId, email: e.userEmail },
                ocorridoEm: iso(e.ocorridoEm),
                termoAceiteId: e.termoAceiteId,
                detalhes: aberto.ok ? aberto.dados : null,
                integridade: aberto.ok
                    ? { decifrado: true, conteudoConfere: aberto.conteudoConfere }
                    : { decifrado: false, conteudoConfere: false, erro: aberto.erro },
                hash: e.hash,
            };
        });
        return { itens, total, pagina, porPagina };
    }

    async listarAlteracoes(f: FiltrosAlteracoesDto): Promise<Pagina<AlteracaoAuditoria>> {
        const { pagina, porPagina, skip } = paginacao(f);
        const { ini, fim } = intervalo(f);

        const qb = this.alteracoes.createQueryBuilder("x");
        if (ini) qb.andWhere("x.ocorrido_em >= :ini", { ini });
        if (fim) qb.andWhere("x.ocorrido_em <= :fim", { fim });
        if (f.modulo) qb.andWhere("x.modulo = :modulo", { modulo: f.modulo });
        if (f.acao) qb.andWhere("x.acao = :acao", { acao: f.acao });
        if (f.falhas === "true") qb.andWhere("x.sucesso = false");
        this.filtroEmail(qb, "x", f.email);

        const [linhas, total] = await qb.orderBy("x.id", "DESC").skip(skip).take(porPagina).getManyAndCount();

        const itens = linhas.map((x): AlteracaoAuditoria => {
            const aberto = this.abrir<DetalhesAlteracao>(x.detalhesCifrados, x.criptoChaveId, aadDaAlteracao(x), x.detalhesHash);
            return {
                id: x.id,
                ocorridoEm: iso(x.ocorridoEm),
                usuario: { id: x.userId, email: x.userEmail },
                modulo: x.modulo,
                acao: x.acao,
                metodo: x.metodo,
                rota: x.rota,
                registroRef: x.registroRef,
                statusHttp: x.statusHttp,
                sucesso: x.sucesso,
                qtdMudancas: x.qtdMudancas,
                detalhes: aberto.ok ? aberto.dados : null,
                integridade: aberto.ok
                    ? { decifrado: true, conteudoConfere: aberto.conteudoConfere }
                    : { decifrado: false, conteudoConfere: false, erro: aberto.erro },
                hash: x.hash,
            };
        });
        return { itens, total, pagina, porPagina };
    }

    private filtroEmail<T extends object>(qb: SelectQueryBuilder<T>, alias: string, email?: string) {
        const termo = email?.trim();
        if (!termo) return;
        const escapado = termo.replace(/[\\%_]/g, (c) => `\\${c}`);
        qb.andWhere(`${alias}.user_email ILIKE :email`, { email: `%${escapado}%` });
    }

    // ── Resumo ────────────────────────────────────────────────────────────────

    async resumo(): Promise<{
        ultimas24h: { loginsSucesso: number; loginsFalha: number; logouts: number; usuariosDistintos: number; alteracoes: number; alteracoesFalha: number; downloads: number };
        totalAceites: number;
        totalEventos: number;
        totalAlteracoes: number;
        ultimoLogin: string | null;
    }> {
        const [porTipo] = await this.eventos.query(`
            SELECT
                COUNT(*) FILTER (WHERE tipo = 'LOGIN_SUCESSO')::int                 AS "sucesso",
                COUNT(*) FILTER (WHERE tipo = 'LOGIN_FALHA')::int                   AS "falha",
                COUNT(*) FILTER (WHERE tipo = 'LOGOUT')::int                        AS "logouts",
                COUNT(DISTINCT user_id) FILTER (WHERE tipo = 'LOGIN_SUCESSO')::int  AS "usuarios"
            FROM "auditoria"."eventos"
            WHERE ocorrido_em >= now() - interval '24 hours'
        `);
        const [dados] = await this.eventos.query(`
            SELECT
                COUNT(*) FILTER (WHERE acao <> 'DOWNLOAD')::int                    AS "alteracoes",
                COUNT(*) FILTER (WHERE acao <> 'DOWNLOAD' AND NOT sucesso)::int    AS "falhas",
                COUNT(*) FILTER (WHERE acao = 'DOWNLOAD')::int                     AS "downloads"
            FROM "auditoria"."alteracoes"
            WHERE ocorrido_em >= now() - interval '24 hours'
        `);
        const [totais] = await this.eventos.query(`
            SELECT
                (SELECT COUNT(*) FROM "auditoria"."termo_aceites")::int AS "aceites",
                (SELECT COUNT(*) FROM "auditoria"."eventos")::int       AS "eventos",
                (SELECT COUNT(*) FROM "auditoria"."alteracoes")::int    AS "alteracoes",
                (SELECT MAX(assinado_em_servidor) FROM "auditoria"."termo_aceites") AS "ultimo"
        `);
        return {
            ultimas24h: {
                loginsSucesso:     porTipo?.sucesso ?? 0,
                loginsFalha:       porTipo?.falha ?? 0,
                logouts:           porTipo?.logouts ?? 0,
                usuariosDistintos: porTipo?.usuarios ?? 0,
                alteracoes:        dados?.alteracoes ?? 0,
                alteracoesFalha:   dados?.falhas ?? 0,
                downloads:         dados?.downloads ?? 0,
            },
            totalAceites: totais?.aceites ?? 0,
            totalEventos: totais?.eventos ?? 0,
            totalAlteracoes: totais?.alteracoes ?? 0,
            ultimoLogin:  totais?.ultimo ? iso(new Date(totais.ultimo)) : null,
        };
    }

    // ── Verificacao de integridade ───────────────────────────────────────────

    /** Recalcula a cadeia de hash e confere o conteudo cifrado de todos os registros. */
    async verificar(): Promise<{ verificadoEm: string; aceites: ResultadoCadeia; eventos: ResultadoCadeia; alteracoes: ResultadoCadeia }> {
        const aceites = await this.percorrer(this.aceites, (a, anterior) => {
            const { id: _id, hash: _h, hashAnterior: _ha, ...campos } = a;
            if (calcularHashRegistro(campos, anterior) !== a.hash) return "hash do registro nao confere";
            const ab = this.abrir(a.dadosAcessoCifrados, a.criptoChaveId, aadDoRegistro(a), a.dadosAcessoHash);
            return ab.ok ? (ab.conteudoConfere ? null : "conteudo") : "ilegivel";
        });
        const eventos = await this.percorrer(this.eventos, (e, anterior) => {
            const { id: _id, hash: _h, hashAnterior: _ha, ...campos } = e;
            if (calcularHashEvento(campos, anterior) !== e.hash) return "hash do registro nao confere";
            const ab = this.abrir(e.detalhesCifrados, e.criptoChaveId, aadDoEvento(e), e.detalhesHash);
            return ab.ok ? (ab.conteudoConfere ? null : "conteudo") : "ilegivel";
        });
        const alteracoes = await this.percorrer(this.alteracoes, (x, anterior) => {
            const { id: _id, hash: _h, hashAnterior: _ha, ...campos } = x;
            if (calcularHashAlteracao(campos, anterior) !== x.hash) return "hash do registro nao confere";
            const ab = this.abrir(x.detalhesCifrados, x.criptoChaveId, aadDaAlteracao(x), x.detalhesHash);
            return ab.ok ? (ab.conteudoConfere ? null : "conteudo") : "ilegivel";
        });
        return { verificadoEm: iso(new Date()), aceites, eventos, alteracoes };
    }

    /**
     * Percorre a tabela em ordem de id. `checar` devolve null (ok), "ilegivel"
     * (sem chave para decifrar — nao quebra a cadeia) ou o motivo do problema.
     */
    private async percorrer<T extends { id: string; hash: string; hashAnterior: string | null }>(
        repo: Repository<T>,
        checar: (linha: T, hashAnterior: string | null) => string | null,
    ): Promise<ResultadoCadeia> {
        let anterior: string | null = null;
        let ultimoId = "0";
        let total = 0;
        let conteudoIlegivel = 0;
        let primeiroProblema: ResultadoCadeia["primeiroProblema"] = null;

        for (;;) {
            const lote = await repo.find({
                where: { id: MoreThan(ultimoId) } as never,
                order: { id: "ASC" } as never,
                take: LOTE_VERIFICACAO,
            });
            if (lote.length === 0) break;

            for (const linha of lote) {
                total++;
                if (!primeiroProblema && linha.hashAnterior !== anterior) {
                    primeiroProblema = { id: linha.id, motivo: "registro anterior ausente ou fora de ordem" };
                }
                const problema = checar(linha, anterior);
                if (problema === "ilegivel") conteudoIlegivel++;
                else if (problema && !primeiroProblema) {
                    primeiroProblema = {
                        id: linha.id,
                        motivo: problema === "conteudo" ? "conteudo decifrado nao confere com o hash" : problema,
                    };
                }
                anterior = linha.hash;
                ultimoId = linha.id;
            }
        }
        return { total, valida: primeiroProblema === null, conteudoIlegivel, primeiroProblema, ultimoHash: anterior };
    }
}
