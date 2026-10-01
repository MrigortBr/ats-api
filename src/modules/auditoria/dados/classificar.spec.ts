import { classificar, referenciaRegistro } from "./classificar";
import { OMITIDO, sanitizarValor } from "./sanitizar";

describe("classificar", () => {
    const casos: [string, string, boolean, string | null, string | null][] = [
        // metodo, caminho, temArquivo, modulo, acao
        ["PUT",    "/distribuicao/12",                             false, "transporte",    "ALTERAR"],
        ["PUT",    "/entrega/3",                                   false, "transporte",    "ALTERAR"],
        ["POST",   "/cib/5",                                       true,  "transporte",    "UPLOAD"],
        ["GET",    "/cib/file/9",                                  false, "transporte",    "DOWNLOAD"],
        ["DELETE", "/uf-comentarios/4",                            false, "transporte",    "EXCLUIR"],
        ["PUT",    "/hospital/7/tomo",                             false, "equipamentos",  "ALTERAR"],
        ["POST",   "/hospital/bulk",                               false, "equipamentos",  "IMPORTAR"],
        ["POST",   "/hospital/combo-equipamento/import-status/apply", false, "equipamentos", "IMPORTAR"],
        ["POST",   "/hospital/combo-equipamento/import-status/preview", false, null, null],
        ["POST",   "/tomo-observacoes/3/imagens",                  false, "equipamentos",  "UPLOAD"],
        ["GET",    "/tomo-observacoes/imagens/file/2",             false, "equipamentos",  "DOWNLOAD"],
        ["GET",    "/documents/combo/1/consult/2/5/download",      false, "equipamentos",  "DOWNLOAD"],
        ["POST",   "/equipamento-convenio/sisconv/import",         false, "equipamentos",  "IMPORTAR"],
        ["POST",   "/empresa/problemas",                           false, "empresa",       "CRIAR"],
        ["POST",   "/empresa/admin/relatorio/8/lock",              false, "empresa",       "BLOQUEIO"],
        ["DELETE", "/empresa/admin/relatorio/8/lock",              false, "empresa",       "BLOQUEIO"],
        ["POST",   "/empresa/gestor/companies/1/users/2/resend-credentials", false, "empresa", "REENVIO_CREDENCIAIS"],
        ["DELETE", "/companies/1",                                 false, "administracao", "EXCLUIR"],
        ["POST",   "/usuarios-internos",                           false, "administracao", "CRIAR"],
        ["POST",   "/rota-nova",                                   false, "outros",        "CRIAR"],
        // nao auditados
        ["GET",    "/distribuicao",                                false, null, null],
        ["POST",   "/auth/login",                                  false, null, null],
        ["GET",    "/auditoria/eventos",                           false, null, null],
    ];

    it.each(casos)("%s %s", (metodo, caminho, arquivo, modulo, acao) => {
        const c = classificar(metodo, caminho, arquivo);
        if (modulo === null) expect(c).toBeNull();
        else expect(c).toEqual({ modulo, acao });
    });

    it("monta a referencia do registro a partir dos parametros", () => {
        expect(referenciaRegistro({ companyId: "1", userId: "2" })).toBe("companyId=1, userId=2");
        expect(referenciaRegistro({})).toBeNull();
    });
});

describe("sanitizarValor", () => {
    it("omite segredos, resume binarios e limita arrays", () => {
        const r = sanitizarValor({
            nome: "x",
            senha: "123",
            novaPassword: "abc",
            token: "t",
            arquivo: Buffer.alloc(10),
            linhas: Array.from({ length: 25 }, (_, i) => ({ i })),
            data: new Date("2026-10-01T12:00:00.000Z"),
        }) as Record<string, unknown>;

        expect(r.nome).toBe("x");
        expect(r.senha).toBe(OMITIDO);
        expect(r.novaPassword).toBe(OMITIDO);
        expect(r.token).toBe(OMITIDO);
        expect(r.arquivo).toBe("[binário 10 bytes]");
        expect((r.linhas as unknown[]).length).toBe(21);
        expect((r.linhas as unknown[])[20]).toContain("total 25");
        expect(r.data).toBe("2026-10-01T12:00:00.000Z");
    });

    it("trunca textos longos", () => {
        expect(String(sanitizarValor("a".repeat(2500)))).toContain("+500 caracteres");
    });
});
