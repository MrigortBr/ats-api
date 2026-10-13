import { chaveNome, hdComAcompanhantes } from "./custeio.service";

describe("hdComAcompanhantes (população em TRS + 10%, arredondada para cima)", () => {
    it.each([
        [0, 0],
        [1, 2],
        [10, 11],
        [11, 13],
        [30, 33],
    ])("%d pacientes em TRS -> %d com acompanhantes", (entrada, esperado) => {
        expect(hdComAcompanhantes(entrada)).toBe(esperado);
    });

    // BUG CONHECIDO: Math.ceil(100 * 1.1) = 111 porque 100 * 1.1 = 110.00000000000001 em ponto flutuante.
    // O resultado correto pela regra é 110. Corrigir exige decisão de negócio (altera números já publicados).
    // Quando corrigir, troque `it.failing` por `it`.
    it.failing.each([
        [50, 55],
        [100, 110],
        [200, 220],
    ])("%d pacientes em TRS -> %d (arredondamento exato)", (entrada, esperado) => {
        expect(hdComAcompanhantes(entrada)).toBe(esperado);
    });
});

describe("chaveNome (comparação de nomes de município)", () => {
    it("ignora acento, caixa e espaços extras", () => {
        expect(chaveNome("  São   JOSÉ do Rio Preto ")).toBe("sao jose do rio preto");
    });

    it("trata nomes equivalentes como a mesma chave", () => {
        expect(chaveNome("Jordão")).toBe(chaveNome("JORDAO"));
    });
});
