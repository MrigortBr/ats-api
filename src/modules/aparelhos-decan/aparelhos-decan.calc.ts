/**
 * Avaliação "antes e depois" das entregas de equipamentos do DECAN, na mesma regra do relatório
 * "Entregas de equipamentos em oncologia 2023–2026":
 *  - as planilhas de entrega só trazem o ANO, então a comparação usa médias mensais por ano calendário;
 *  - antes  = média mensal do ano anterior ao da entrega (jan–dez);
 *  - depois = média mensal do ano seguinte ao da entrega, até a última competência disponível;
 *  - entregas de 2026 (sem o mês): antes = 2025, depois = jan/2026 até a última competência, marcado como parcial;
 *  - entregas de 2023 sem série de 2022 usam o total de 2022 (aba Impacto) dividido por 12.
 * A produção é do estabelecimento como um todo, não do equipamento entregue.
 */
export type Serie = Record<string, [number, number]>;

export type Situacao = "up" | "flat" | "down" | "none" | "prov";

export interface EntradaAvaliacao {
    ano: number;
    serie: Serie;
    producao2022: [number, number] | null;
}

export interface Avaliacao {
    mediaAntes: number | null;
    mediaDepois: number | null;
    /** Fração (0,15 = +15%); null quando a média anterior é zero ou não há "depois". */
    variacao: number | null;
    situacao: Situacao;
    /** Rótulo legível: Acima, Estável, Abaixo, Início de produção, Produção zerada, Sem produção ou Parcial. */
    situacaoRotulo: string;
    parcial: boolean;
    janelaAntes: string;
    janelaDepois: string;
    /** Média mensal dos últimos 12 meses disponíveis. */
    media12Meses: number | null;
    /** Soma dos últimos 3 meses disponíveis. */
    ultimos3Meses: number;
}

const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const ym = (y: number, m: number) => `${y}${String(m).padStart(2, "0")}`;

export function intervalo(a: string, b: string): string[] {
    const out: string[] = [];
    let y = Number(a.slice(0, 4));
    let m = Number(a.slice(4));
    while (ym(y, m) <= b) {
        out.push(ym(y, m));
        m++;
        if (m > 12) { m = 1; y++; }
    }
    return out;
}

function janela(serie: Serie, lista: string[]): { freq: number; meses: number; media: number | null } {
    let freq = 0;
    let meses = 0;
    for (const c of lista) {
        if (c in serie) { freq += serie[c][0]; meses++; }
    }
    return { freq, meses, media: meses > 0 ? freq / meses : null };
}

/** "202609" -> "set/26" */
export function rotuloCompetencia(c: string): string {
    return `${MES[Number(c.slice(4)) - 1]}/${c.slice(2, 4)}`;
}

export function avaliar(entrada: EntradaAvaliacao, max: string): Avaliacao {
    const { ano, serie, producao2022 } = entrada;
    const ate = rotuloCompetencia(max);
    let antes: { freq: number; meses: number; media: number | null };
    let depois: { freq: number; meses: number; media: number | null };
    let parcial = false;
    let janelaAntes: string;
    let janelaDepois: string;

    if (ano < 2026) {
        antes = janela(serie, intervalo(ym(ano - 1, 1), ym(ano - 1, 12)));
        if (producao2022 && ano === 2023) {
            antes = { freq: producao2022[0], meses: 12, media: producao2022[0] / 12 };
        }
        depois = janela(serie, intervalo(ym(ano + 1, 1), max));
        janelaAntes = String(ano - 1);
        janelaDepois = ano + 1 === 2026 ? `jan–${ate}` : `${ano + 1}–${ate}`;
    } else {
        parcial = true;
        antes = janela(serie, intervalo("202501", "202512"));
        depois = janela(serie, intervalo("202601", max));
        janelaAntes = "2025";
        janelaDepois = `jan–${ate}*`;
    }

    const a = antes.media ?? 0;
    const b = depois.media ?? 0;
    const variacao = a > 0 ? (b - a) / a : null;

    let base: Situacao;
    let rotulo: string;
    if (a === 0 && b === 0) { base = "none"; rotulo = "Sem produção"; }
    else if (a === 0 && b > 0) { base = "up"; rotulo = "Início de produção"; }
    else if (a > 0 && b === 0) { base = "down"; rotulo = "Produção zerada"; }
    else if ((variacao as number) >= 0.1) { base = "up"; rotulo = "Acima"; }
    else if ((variacao as number) <= -0.1) { base = "down"; rotulo = "Abaixo"; }
    else { base = "flat"; rotulo = "Estável"; }

    const ult12 = janela(serie, intervalo(deslocar(max, -11), max));
    const ult3 = janela(serie, intervalo(deslocar(max, -2), max));

    return {
        mediaAntes: antes.media,
        mediaDepois: depois.media,
        variacao,
        situacao: parcial ? "prov" : base,
        situacaoRotulo: parcial ? `${rotulo} (parcial)` : rotulo,
        parcial,
        janelaAntes,
        janelaDepois,
        media12Meses: ult12.media,
        ultimos3Meses: ult3.freq,
    };
}

/** Desloca uma competência AAAAMM em k meses. */
export function deslocar(c: string, k: number): string {
    let y = Number(c.slice(0, 4));
    let m = Number(c.slice(4)) + k;
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    return ym(y, m);
}
