import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { avaliar, type Avaliacao, type Serie } from "./aparelhos-decan.calc";

export type CategoriaAparelho = "ACE" | "MAM" | "BRA" | "PET" | "RM" | "TC";

export interface AparelhoDecanRow extends Avaliacao {
    idRelatorio: string;
    categoria: CategoriaAparelho;
    instrumento: string | null;
    uf: string;
    municipio: string;
    estabelecimento: string;
    anoEntrega: number;
    quantidade: number;
    valor: number | null;
    cnes: string | null;
    nomeCnes: string | null;
    habilitacaoCod: string | null;
    habilitacaoDescricao: string | null;
    habilitacaoTipo: string | null;
    habilitacaoAno: number | null;
    noCnes: boolean | null;
    qtdNoCnes: number | null;
    obs: string | null;
    /** [competência AAAAMM, frequência, valor R$] */
    producaoMensal: [string, number, number][];
    /** Total de 2022 [frequência, valor] quando a série mensal só começa em 2023. */
    producao2022: [number, number] | null;
}

export interface AparelhosDecanResposta {
    rows: AparelhoDecanRow[];
    count: number;
    /** Última competência com produção carregada (AAAAMM). */
    producaoAte: string | null;
    /** Quando os dados foram carregados/atualizados pela última vez (maior updated_at das entregas), em ISO. */
    atualizadoEm: string | null;
}

interface EntregaDb {
    id_relatorio: string;
    categoria: CategoriaAparelho;
    instrumento: string | null;
    uf: string;
    municipio: string;
    estabelecimento: string;
    ano_entrega: number;
    quantidade: number;
    valor: string | null;
    cnes: string | null;
    nome_cnes: string | null;
    habilitacao_cod: string | null;
    habilitacao_descricao: string | null;
    habilitacao_tipo: string | null;
    habilitacao_ano: number | null;
    no_cnes: boolean | null;
    qtd_no_cnes: number | null;
    obs: string | null;
    producao_2022_freq: number | null;
    producao_2022_valor: string | null;
    updated_at: Date | string;
}

interface MesDb {
    id_relatorio: string;
    competencia: string;
    frequencia: number;
    valor: string;
}

const ORDEM_CATEGORIA: CategoriaAparelho[] = ["ACE", "MAM", "BRA", "PET", "RM", "TC"];

/**
 * Entregas de equipamentos de oncologia do DECAN (2023–2026), com a produção do relatório de entregas.
 * Carga: seed aparelhos-decan (tabelas aparelho_decan e aparelho_decan_producao_mensal).
 */
@Injectable()
export class AparelhosDecanService {
    constructor(private readonly dataSource: DataSource) {}

    async listar(): Promise<AparelhosDecanResposta> {
        const entregas: EntregaDb[] = await this.dataSource.query(`
            SELECT id_relatorio, categoria, instrumento, uf, municipio, estabelecimento, ano_entrega, quantidade, valor,
                   cnes, nome_cnes, habilitacao_cod, habilitacao_descricao, habilitacao_tipo, habilitacao_ano,
                   no_cnes, qtd_no_cnes, obs, producao_2022_freq, producao_2022_valor, updated_at
            FROM aparelho_decan
        `);
        const meses: MesDb[] = await this.dataSource.query(`
            SELECT id_relatorio, competencia, frequencia, valor
            FROM aparelho_decan_producao_mensal
            ORDER BY id_relatorio, competencia
        `);

        const porEntrega = new Map<string, [string, number, number][]>();
        let max: string | null = null;
        for (const m of meses) {
            const lista = porEntrega.get(m.id_relatorio) ?? [];
            lista.push([m.competencia, m.frequencia, Number(m.valor)]);
            porEntrega.set(m.id_relatorio, lista);
            if (!max || m.competencia > max) max = m.competencia;
        }

        const rows = entregas
            .map((e): AparelhoDecanRow => {
                const producaoMensal = porEntrega.get(e.id_relatorio) ?? [];
                const serie: Serie = {};
                for (const [c, f, v] of producaoMensal) serie[c] = [f, v];
                const avaliacao = avaliar(
                    {
                        ano: e.ano_entrega,
                        serie,
                        producao2022: e.producao_2022_freq != null
                            ? [e.producao_2022_freq, Number(e.producao_2022_valor ?? 0)]
                            : null,
                    },
                    max ?? "202609",
                );
                return {
                    idRelatorio: e.id_relatorio,
                    categoria: e.categoria,
                    instrumento: e.instrumento,
                    uf: e.uf,
                    municipio: e.municipio,
                    estabelecimento: e.estabelecimento,
                    anoEntrega: e.ano_entrega,
                    quantidade: e.quantidade,
                    valor: e.valor != null ? Number(e.valor) : null,
                    cnes: e.cnes,
                    nomeCnes: e.nome_cnes,
                    habilitacaoCod: e.habilitacao_cod,
                    habilitacaoDescricao: e.habilitacao_descricao,
                    habilitacaoTipo: e.habilitacao_tipo,
                    habilitacaoAno: e.habilitacao_ano,
                    noCnes: e.no_cnes,
                    qtdNoCnes: e.qtd_no_cnes,
                    obs: e.obs,
                    producaoMensal,
                    producao2022: e.producao_2022_freq != null
                        ? [e.producao_2022_freq, Number(e.producao_2022_valor ?? 0)]
                        : null,
                    ...avaliacao,
                };
            })
            .sort((a, b) =>
                ORDEM_CATEGORIA.indexOf(a.categoria) - ORDEM_CATEGORIA.indexOf(b.categoria)
                || a.anoEntrega - b.anoEntrega
                || a.uf.localeCompare(b.uf)
                || a.estabelecimento.localeCompare(b.estabelecimento),
            );

        const atualizadoEm = entregas.reduce<number | null>((maisRecente, e) => {
            const t = new Date(e.updated_at).getTime();
            return Number.isFinite(t) && (maisRecente === null || t > maisRecente) ? t : maisRecente;
        }, null);

        return {
            rows,
            count: rows.length,
            producaoAte: max,
            atualizadoEm: atualizadoEm === null ? null : new Date(atualizadoEm).toISOString(),
        };
    }
}
