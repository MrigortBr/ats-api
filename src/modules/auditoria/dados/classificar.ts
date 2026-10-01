import type { AcaoDados, ModuloAuditado } from "../entities/auditoria-alteracao.entity";

/** Primeiro segmento da rota -> modulo do sistema. */
const MODULO_POR_SEGMENTO: Record<string, ModuloAuditado> = {
    // Transporte sanitario
    "distribuicao":          "transporte",
    "entrega":               "transporte",
    "cota-geral":            "transporte",
    "cota-geral-municipio":  "transporte",
    "consolidado":           "transporte",
    "uf":                    "transporte",
    "uf-comentarios":        "transporte",
    "cib":                   "transporte",
    "cib-municipio":         "transporte",
    "transport-value":       "transporte",
    // Equipamentos (TOMO, RNM, combos, aceleradores, convenios)
    "hospital":                          "equipamentos",
    "tomo-doc":                          "equipamentos",
    "rnm-doc":                           "equipamentos",
    "documents":                         "equipamentos",
    "acelerador-observacoes":            "equipamentos",
    "combo-equipamento-observacoes":     "equipamentos",
    "combo-estabelecimento-observacoes": "equipamentos",
    "tomo-observacoes":                  "equipamentos",
    "rnm-observacoes":                   "equipamentos",
    "equipamento-convenio":              "equipamentos",
    // Painel da empresa (fornecedores, gestores)
    "empresa":               "empresa",
    // Cadastros administrativos
    "companies":             "administracao",
    "usuarios-internos":     "administracao",
    "roles":                 "administracao",
};

/** Rotas que nunca passam por aqui (tem trilha propria). */
const IGNORADAS = new Set(["auth", "auditoria"]);

const METODOS_ESCRITA = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** GET que entrega arquivo (documentos, imagens de observacao, CIB). */
const ROTA_DOWNLOAD = /(^|\/)(file|download)(\/|$)/;

export interface Classificacao {
    modulo: ModuloAuditado;
    acao: AcaoDados;
}

function segmentos(caminho: string): string[] {
    return caminho.split("?")[0].split("/").filter(Boolean);
}

/** Decide se a requisicao e auditada e como classifica-la. null = nao auditar. */
export function classificar(metodo: string, caminho: string, temArquivo: boolean): Classificacao | null {
    const segs = segmentos(caminho);
    const primeiro = segs[0] ?? "";
    if (!primeiro || IGNORADAS.has(primeiro)) return null;

    const m = metodo.toUpperCase();
    const ehDownload = m === "GET" && ROTA_DOWNLOAD.test(segs.join("/"));
    if (!METODOS_ESCRITA.has(m) && !ehDownload) return null;
    // Pre-visualizacao de importacao nao grava nada.
    if (segs[segs.length - 1] === "preview") return null;

    const modulo = MODULO_POR_SEGMENTO[primeiro] ?? "outros";
    const rota = segs.join("/").toLowerCase();

    let acao: AcaoDados;
    if (ehDownload) acao = "DOWNLOAD";
    else if (rota.includes("resend-credentials")) acao = "REENVIO_CREDENCIAIS";
    else if (/(^|\/)lock(\/|$)/.test(rota)) acao = "BLOQUEIO";
    else if (/(import|bulk)/.test(rota)) acao = "IMPORTAR";
    else if (m === "DELETE") acao = "EXCLUIR";
    else if (m === "PUT" || m === "PATCH") acao = "ALTERAR";
    else if (temArquivo || /(upload|imagens)(\/|$)/.test(rota)) acao = "UPLOAD";
    else acao = "CRIAR";

    return { modulo, acao };
}

/** "ufId=12, id=3" a partir dos parametros da rota. */
export function referenciaRegistro(params: Record<string, string> | undefined): string | null {
    const pares = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "");
    return pares.length ? pares.map(([k, v]) => `${k}=${v}`).join(", ") : null;
}
