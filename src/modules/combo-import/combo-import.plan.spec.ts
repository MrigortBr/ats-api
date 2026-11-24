import { LinhaBanco, canonicoDoBanco, dataParaBr, dataParaSerial, empresaIdPorPrefixo, normalizarChave, planejar, resumir } from "./combo-import.plan";

const K = "ADV_0001_LASER";

function banco(over: Partial<LinhaBanco> = {}, valores: LinhaBanco["valores"] = {}): LinhaBanco {
    return { id: 1, equipKey: K, lockedBy: null, deletedAt: null, valores: { equipment_name: "Laser", ...valores }, ...over };
}

function row(extra: Record<string, unknown> = {}): Record<string, unknown> {
    return { __linha: 2, Chave_por_equipamento: K, Chave_por_estabelecimento: "E1", Equipamento: "Laser", ...extra };
}

describe("normalizadores", () => {
    it("chave: NBSP e espaços duplicados", () => {
        expect(normalizarChave(" A  B  ")).toBe("A B");
        expect(normalizarChave("   ")).toBeNull();
    });

    it("data: serial, dd/mm/aaaa, dd/mm/aa e inválida", () => {
        expect(dataParaSerial(46160)).toBe("46160");
        expect(dataParaSerial("46160")).toBe("46160");
        expect(dataParaSerial("06/05/2026")).toBe("46148");
        expect(dataParaSerial("06/05/26")).toBe("46148");
        expect(dataParaSerial("31/02/2026")).toBeNull();
        expect(dataParaSerial("abc")).toBeNull();
    });

    it("banco: data dd/mm/aaaa continua dd/mm/aaaa e serial vira dd/mm/aaaa", () => {
        expect(canonicoDoBanco("delivery_date", "06/05/2026")).toBe("06/05/2026");
        expect(canonicoDoBanco("delivery_date", "46148")).toBe("06/05/2026");
    });

    it("dataParaBr: serial, dd/mm/aa, ISO e inválida", () => {
        expect(dataParaBr(46245)).toBe("11/08/2026");
        expect(dataParaBr("6/5/26")).toBe("06/05/2026");
        expect(dataParaBr("2026-05-06")).toBe("06/05/2026");
        expect(dataParaBr("31/02/2026")).toBeNull();
        expect(dataParaBr("abc")).toBeNull();
    });

    it("empresa pelo prefixo da chave, ignorando acento e caixa", () => {
        const empresas = [
            { id: 1, name: "Hospcom Equipamentos Hospitalares LTDA" },
            { id: 4, name: "Advanced Industria Medica" },
            { id: 5, name: "Bl Industria e Comercio de Maquinas e Fornos Ltda." },
            { id: 7, name: "W M Jr - Comercio de Equipamentos Medicos LTDA" },
        ];
        expect(empresaIdPorPrefixo(empresas, "ADV")).toBe(4);
        expect(empresaIdPorPrefixo(empresas, "hos")).toBe(1);
        expect(empresaIdPorPrefixo(empresas, "BLI")).toBe(5);
        expect(empresaIdPorPrefixo(empresas, "WMJ")).toBe(7);
        expect(empresaIdPorPrefixo(empresas, "KSS")).toBeNull();
        expect(empresaIdPorPrefixo(empresas, "XXX")).toBeNull();
    });
});

describe("planejar", () => {
    it("célula vazia nunca apaga o banco", () => {
        const p = planejar([banco({}, { notes: "x" })], [row({ Obs: "" })]);
        expect(p.itens[0].acao).toBe("sem_mudanca");
    });

    it("preenche vazio e substitui diferente", () => {
        const p = planejar(
            [banco({}, { notes: "velha", nf_number: null })],
            [row({ Obs: "nova", "Nº NF": "10" })],
        );
        const m = p.itens[0].mudancas;
        expect(m.find((x) => x.coluna === "notes")?.tipo).toBe("substituir");
        expect(m.find((x) => x.coluna === "nf_number")?.tipo).toBe("preencher");
    });

    it("números e booleanos no formato brasileiro", () => {
        const p = planejar([banco()], [row({ "Valor da NF": "4.234,60", "Enviada Nota Fiscal": "NÃO " })]);
        const m = p.itens[0].mudancas;
        expect(m.find((x) => x.coluna === "nf_value")?.para).toBe(4234.6);
        expect(m.find((x) => x.coluna === "nf_sent")?.para).toBe(false);
    });

    it("valor igual não gera mudança (data em formatos diferentes)", () => {
        const p = planejar([banco({}, { delivery_date: "06/05/2026" })], [row({ "Data de Entrega Concretizada ao Destinatário": 46148 })]);
        expect(p.itens[0].acao).toBe("sem_mudanca");
    });

    it("grava data nova em dd/mm/aaaa (formato do banco), não em serial", () => {
        const p = planejar([banco({}, { delivery_date: null })], [row({ "Data de Entrega Concretizada ao Destinatário": 46148 })]);
        expect(p.itens[0].mudancas.find((x) => x.coluna === "delivery_date")?.para).toBe("06/05/2026");
        const c = planejar([], [row({ "Data de Entrega Concretizada ao Destinatário": 46148 })]);
        expect(c.itens[0].novo?.valores.delivery_date).toBe("06/05/2026");
    });

    it("casa chave com NBSP", () => {
        const p = planejar([banco()], [row({ Chave_por_equipamento: "ADV_0001_LASER " })]);
        expect(p.itens[0].acao).not.toBe("criar");
    });

    it("pula travada, excluída e duplicada", () => {
        expect(planejar([banco({ lockedBy: "a@b" })], [row()]).itens[0].acao).toBe("travada");
        expect(planejar([banco({ deletedAt: new Date() })], [row()]).itens[0].acao).toBe("excluida_no_sistema");
        const p = planejar([banco()], [row({ __linha: 2 }), row({ __linha: 3 })]);
        expect(p.itens.map((i) => i.acao)).toEqual(["duplicada", "duplicada"]);
    });

    it("cria chave nova só com estab_key e equipamento", () => {
        expect(planejar([], [row()]).itens[0].acao).toBe("criar");
        expect(planejar([], [row({ Chave_por_estabelecimento: "" })]).itens[0].acao).toBe("invalida");
        expect(planejar([], [row({ Equipamento: "" })]).itens[0].acao).toBe("invalida");
    });

    it("não muda as chaves de linha existente e resume", () => {
        const p = planejar([banco()], [row({ Obs: "x" })]);
        expect(p.itens[0].mudancas.some((m) => (m.coluna as string) === "equip_key")).toBe(false);
        expect(resumir(p)).toMatchObject({ atualizar: 1, camposPreenchidos: 1 });
    });
});
