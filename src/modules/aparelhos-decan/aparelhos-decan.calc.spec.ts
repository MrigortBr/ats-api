import { avaliar, deslocar, intervalo, type Serie } from "./aparelhos-decan.calc";

const MAX = "202609";

/** Série plana: mesma frequência em todos os meses do intervalo. */
function plana(de: string, ate: string, freq: number): Serie {
    const s: Serie = {};
    for (const c of intervalo(de, ate)) s[c] = [freq, freq * 10];
    return s;
}

describe("aparelhos-decan.calc", () => {
    it("intervalo e deslocar atravessam virada de ano", () => {
        expect(intervalo("202511", "202602")).toEqual(["202511", "202512", "202601", "202602"]);
        expect(deslocar("202601", -1)).toBe("202512");
        expect(deslocar("202609", -11)).toBe("202510");
    });

    it("entrega de 2024: antes = média de 2023, depois = 2025 até a última competência", () => {
        const serie = { ...plana("202301", "202312", 100), ...plana("202501", MAX, 150) };
        const r = avaliar({ ano: 2024, serie, producao2022: null }, MAX);
        expect(r.mediaAntes).toBe(100);
        expect(r.mediaDepois).toBe(150);
        expect(r.variacao).toBeCloseTo(0.5);
        expect(r.situacao).toBe("up");
        expect(r.situacaoRotulo).toBe("Acima");
        expect(r.janelaAntes).toBe("2023");
        expect(r.janelaDepois).toBe("2025–set/26");
        expect(r.parcial).toBe(false);
    });

    it("variação entre -10% e +10% é estável", () => {
        const serie = { ...plana("202401", "202412", 100), ...plana("202601", MAX, 105) };
        const r = avaliar({ ano: 2025, serie, producao2022: null }, MAX);
        expect(r.situacao).toBe("flat");
        expect(r.janelaDepois).toBe("jan–set/26");
    });

    it("entrega de 2023 usa o total de 2022 dividido por 12 quando informado", () => {
        const serie = plana("202401", MAX, 60);
        const r = avaliar({ ano: 2023, serie, producao2022: [1200, 5000] }, MAX);
        expect(r.mediaAntes).toBe(100);
        expect(r.situacao).toBe("down");
        expect(r.situacaoRotulo).toBe("Abaixo");
    });

    it("sem produção antes e depois é 'Sem produção'; só depois é 'Início de produção'; só antes é 'Produção zerada'", () => {
        expect(avaliar({ ano: 2024, serie: plana("202301", MAX, 0), producao2022: null }, MAX).situacaoRotulo).toBe("Sem produção");
        expect(avaliar({ ano: 2024, serie: { ...plana("202301", "202312", 0), ...plana("202501", MAX, 5) }, producao2022: null }, MAX).situacaoRotulo).toBe("Início de produção");
        const zerada = avaliar({ ano: 2024, serie: { ...plana("202301", "202312", 5), ...plana("202501", MAX, 0) }, producao2022: null }, MAX);
        expect(zerada.situacaoRotulo).toBe("Produção zerada");
        expect(zerada.variacao).toBe(-1);
    });

    it("entrega de 2026 é parcial: antes = 2025, depois = jan/26 até a última competência", () => {
        const serie = { ...plana("202501", "202512", 100), ...plana("202601", MAX, 200) };
        const r = avaliar({ ano: 2026, serie, producao2022: null }, MAX);
        expect(r.parcial).toBe(true);
        expect(r.situacao).toBe("prov");
        expect(r.situacaoRotulo).toBe("Acima (parcial)");
        expect(r.janelaDepois).toBe("jan–set/26*");
    });

    it("calcula média dos últimos 12 meses e soma dos últimos 3", () => {
        const serie = plana("202401", MAX, 10);
        const r = avaliar({ ano: 2025, serie, producao2022: null }, MAX);
        expect(r.media12Meses).toBe(10);
        expect(r.ultimos3Meses).toBe(30);
    });
});
