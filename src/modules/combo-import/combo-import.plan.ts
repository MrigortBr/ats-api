/**
 * Lógica PURA (sem banco) da importação da aba "Consulta_Consolidada" para combo_consult.
 *
 * Regras:
 *  - célula vazia na planilha NUNCA apaga o banco;
 *  - célula preenchida e banco vazio  -> "preencher";
 *  - célula preenchida e valor diferente -> "substituir";
 *  - chave de equipamento (equip_key) casa depois de normalizar espaços (inclui NBSP);
 *  - equip_key e estab_key de linha existente nunca mudam (observações apontam para elas);
 *  - chave duplicada na planilha, linha travada ou excluída no sistema não são gravadas.
 */

export type TipoCampo = "texto" | "data" | "bool" | "dinheiro" | "inteiro";

export type Coluna =
    | "combo_code" | "uf_municipio" | "region" | "uf" | "municipality" | "ibge" | "cnes"
    | "establishment_name" | "cnpj" | "combo_type" | "delivery_parcel" | "equipment_name"
    | "serial_number" | "expedition_date" | "delivery_forecast" | "delivery_date"
    | "installation_date" | "training_date" | "delivery_status" | "equipment_count"
    | "nf_sent" | "nf_number" | "nf_sent_date" | "nf_value" | "provisional_receipt_sent"
    | "final_receipt_sent" | "payment1_value" | "payment1_nup" | "payment1_sent_date"
    | "payment2_value" | "payment2_nup" | "payment2_sent_date" | "payment2_deadline"
    | "total_paid" | "payment_status" | "notes" | "address" | "manager_data"
    | "manager_phone" | "focal_point_data" | "focal_point_phone" | "establishment_email"
    | "focal_point_email" | "contract";

export interface CampoDef {
    header: string;
    coluna: Coluna;
    tipo: TipoCampo;
}

export const HEADER_CHAVE_EQUIPAMENTO = "Chave_por_equipamento";
export const HEADER_CHAVE_ESTABELECIMENTO = "Chave_por_estabelecimento";
export const CHAVE_LINHA = "__linha";

export const CAMPOS: readonly CampoDef[] = [
    { header: "Nº", coluna: "combo_code", tipo: "texto" },
    { header: "UF_MUNICÍPIO (sem acento)", coluna: "uf_municipio", tipo: "texto" },
    { header: "Região", coluna: "region", tipo: "texto" },
    { header: "UF", coluna: "uf", tipo: "texto" },
    { header: "Município", coluna: "municipality", tipo: "texto" },
    { header: "IBGE7", coluna: "ibge", tipo: "texto" },
    { header: "CNES", coluna: "cnes", tipo: "texto" },
    { header: "Estabelecimento", coluna: "establishment_name", tipo: "texto" },
    { header: "CNPJ", coluna: "cnpj", tipo: "texto" },
    { header: "Combo", coluna: "combo_type", tipo: "texto" },
    { header: "Parcela de Entrega", coluna: "delivery_parcel", tipo: "texto" },
    { header: "Equipamento", coluna: "equipment_name", tipo: "texto" },
    { header: "Nº de Série do Equipamento", coluna: "serial_number", tipo: "texto" },
    { header: "Data de Expedição", coluna: "expedition_date", tipo: "data" },
    { header: "Previsão de Entrega ao Destinatário", coluna: "delivery_forecast", tipo: "data" },
    { header: "Data de Entrega Concretizada ao Destinatário", coluna: "delivery_date", tipo: "data" },
    { header: "Data de Instalação", coluna: "installation_date", tipo: "data" },
    { header: "Data de Capacitação", coluna: "training_date", tipo: "data" },
    { header: "Situação de Entrega", coluna: "delivery_status", tipo: "texto" },
    { header: "Quantidade de Equipamentos", coluna: "equipment_count", tipo: "inteiro" },
    { header: "Enviada Nota Fiscal", coluna: "nf_sent", tipo: "bool" },
    { header: "Nº NF", coluna: "nf_number", tipo: "texto" },
    { header: "Data de Envio da NF", coluna: "nf_sent_date", tipo: "data" },
    { header: "Valor da NF", coluna: "nf_value", tipo: "dinheiro" },
    { header: "Enviado Termo de Recebimento Provisório", coluna: "provisional_receipt_sent", tipo: "bool" },
    { header: "Enviado Termo de Recebimento Definitivo", coluna: "final_receipt_sent", tipo: "bool" },
    { header: "Valor 1º Pagamento", coluna: "payment1_value", tipo: "dinheiro" },
    { header: "NUP 1º Pagamento", coluna: "payment1_nup", tipo: "texto" },
    { header: "Data de Envio para Pagamento da 1ª Parcela", coluna: "payment1_sent_date", tipo: "data" },
    { header: "Valor 2º Pagamento", coluna: "payment2_value", tipo: "dinheiro" },
    { header: "NUP 2º Pagamento", coluna: "payment2_nup", tipo: "texto" },
    { header: "Data de Envio para Pagamento da 2ª Parcela", coluna: "payment2_sent_date", tipo: "data" },
    { header: "Data Final para Pagamento da 2ª Parcela", coluna: "payment2_deadline", tipo: "data" },
    { header: "Valor Total Pago", coluna: "total_paid", tipo: "dinheiro" },
    { header: "Status Pagamento", coluna: "payment_status", tipo: "texto" },
    { header: "Obs", coluna: "notes", tipo: "texto" },
    { header: "Endereço do Estabelecimento", coluna: "address", tipo: "texto" },
    { header: "Dados Gestor do Estabelecimento", coluna: "manager_data", tipo: "texto" },
    { header: "Telefone", coluna: "manager_phone", tipo: "texto" },
    { header: "Dados do Ponto Focal", coluna: "focal_point_data", tipo: "texto" },
    { header: "Telefone do Ponto Focal", coluna: "focal_point_phone", tipo: "texto" },
    { header: "E-mail", coluna: "establishment_email", tipo: "texto" },
    { header: "E-mail do Ponto Focal", coluna: "focal_point_email", tipo: "texto" },
    { header: "Contrato", coluna: "contract", tipo: "texto" },
];

export const ROTULO: Record<Coluna, string> = Object.fromEntries(CAMPOS.map((c) => [c.coluna, c.header])) as Record<Coluna, string>;
const TIPO: Record<Coluna, TipoCampo> = Object.fromEntries(CAMPOS.map((c) => [c.coluna, c.tipo])) as Record<Coluna, TipoCampo>;

export type Valor = string | number | boolean;
export type Valores = Partial<Record<Coluna, Valor>>;

// ── normalização ──────────────────────────────────────────────────────────────

/** Chave: sem NBSP, espaços colapsados, sem bordas. */
export function normalizarChave(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v).replace(/[ ​]/g, " ").replace(/\s+/g, " ").trim();
    return s === "" ? null : s;
}

/** Texto: preserva quebras de linha internas (ex.: várias NFs numa célula). */
export function normalizarTexto(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    const s = (typeof v === "number" ? String(v) : String(v))
        .replace(/[ ​]/g, " ")
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .trim();
    return s === "" ? null : s;
}

const DIAS_ATE_1970 = 25569;
const MS_DIA = 86_400_000;

/** Número de série do Excel para uma data civil (UTC). Nulo se a data não existe. */
function serialDe(ano: number, mes: number, dia: number): number | null {
    const d = new Date(Date.UTC(ano, mes - 1, dia));
    if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
    return Math.round(d.getTime() / MS_DIA) + DIAS_ATE_1970;
}

/** Data em qualquer formato aceito -> serial do Excel como texto. Nulo se não reconhecida. */
export function dataParaSerial(v: unknown): string | null {
    if (typeof v === "number") return Number.isFinite(v) ? String(Math.trunc(v)) : null;
    const s = normalizarTexto(v);
    if (s === null) return null;
    if (/^\d{4,6}(\.\d+)?$/.test(s)) return String(Math.trunc(Number(s)));
    let m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(s);
    if (m) {
        const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
        const n = serialDe(ano, Number(m[2]), Number(m[1]));
        return n === null ? null : String(n);
    }
    m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(s);
    if (m) {
        const n = serialDe(Number(m[1]), Number(m[2]), Number(m[3]));
        return n === null ? null : String(n);
    }
    return null;
}

function paraBool(v: unknown): boolean | null | "invalido" {
    if (typeof v === "boolean") return v;
    const s = normalizarTexto(v);
    if (s === null) return null;
    const u = s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
    if (u === "SIM" || u === "S" || u === "TRUE") return true;
    if (u === "NAO" || u === "N" || u === "FALSE") return false;
    return "invalido";
}

function paraDinheiro(v: unknown): number | null | "invalido" {
    if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) / 100 : "invalido";
    const s = normalizarTexto(v);
    if (s === null) return null;
    let t = s.replace(/^R\$\s*/i, "").replace(/\s/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(t)) return "invalido";
    return Math.round(Number(t) * 100) / 100;
}

function paraInteiro(v: unknown): number | null | "invalido" {
    if (typeof v === "number") return Number.isInteger(v) ? v : "invalido";
    const s = normalizarTexto(v);
    if (s === null) return null;
    return /^-?\d+$/.test(s) ? Number(s) : "invalido";
}

export interface LinhaLida {
    linha: number | null;
    chave: string | null;
    chaveEstab: string | null;
    valores: Valores;
    avisos: string[];
}

/** Lê uma linha bruta (objeto cabeçalho -> célula) e normaliza cada campo. */
export function lerLinha(raw: Record<string, unknown>): LinhaLida {
    const linhaRaw = raw[CHAVE_LINHA];
    const linha = typeof linhaRaw === "number" ? linhaRaw : null;
    const chave = normalizarChave(raw[HEADER_CHAVE_EQUIPAMENTO]);
    const chaveEstab = normalizarChave(raw[HEADER_CHAVE_ESTABELECIMENTO]);
    const valores: Valores = {};
    const avisos: string[] = [];

    for (const c of CAMPOS) {
        const cel = raw[c.header];
        if (cel === undefined || cel === null) continue;
        let valor: Valor | null | "invalido";
        switch (c.tipo) {
            case "texto": valor = normalizarTexto(cel); break;
            case "data": {
                if (normalizarTexto(cel) === null) { valor = null; break; }
                const serial = dataParaSerial(cel);
                valor = serial === null ? "invalido" : serial;
                break;
            }
            case "bool": valor = paraBool(cel); break;
            case "dinheiro": valor = paraDinheiro(cel); break;
            case "inteiro": valor = paraInteiro(cel); break;
        }
        if (valor === null) continue; // vazio: ignora
        if (valor === "invalido") {
            avisos.push(`${c.header}: valor "${String(cel).slice(0, 40)}" não reconhecido (campo ignorado)`);
            continue;
        }
        if (c.coluna === "cnes" && typeof valor === "string") valor = valor.replace(/\D/g, "").padStart(7, "0");
        if (c.coluna === "uf" && typeof valor === "string") valor = valor.toUpperCase().slice(0, 2);
        valores[c.coluna] = valor;
    }
    return { linha, chave, chaveEstab, valores, avisos };
}

// ── comparação com o banco ────────────────────────────────────────────────────

/** Normaliza o valor que está no banco para o mesmo formato canônico usado na comparação. */
export function canonicoDoBanco(coluna: Coluna, v: unknown): Valor | null {
    if (v === null || v === undefined) return null;
    switch (TIPO[coluna]) {
        case "texto": return normalizarTexto(v);
        case "data": {
            const s = normalizarTexto(v);
            if (s === null) return null;
            return dataParaSerial(s) ?? s;
        }
        case "bool": return typeof v === "boolean" ? v : null;
        case "dinheiro": { const n = Number(v); return Number.isFinite(n) ? Math.round(n * 100) / 100 : null; }
        case "inteiro": { const n = Number(v); return Number.isFinite(n) ? n : null; }
    }
}

export interface Mudanca {
    coluna: Coluna;
    rotulo: string;
    de: Valor | null;
    para: Valor;
    tipo: "preencher" | "substituir";
}

export interface LinhaBanco {
    id: number;
    equipKey: string | null;
    lockedBy: string | null;
    deletedAt: Date | string | null;
    valores: Partial<Record<Coluna, unknown>>;
}

export type Acao = "criar" | "atualizar" | "sem_mudanca" | "travada" | "excluida_no_sistema" | "duplicada" | "invalida";

export interface ItemPlano {
    linha: number | null;
    chave: string | null;
    acao: Acao;
    motivo?: string;
    id?: number;
    mudancas: Mudanca[];
    /** Para "criar": todos os valores + chaves. */
    novo?: { equipKey: string; estabKey: string; valores: Valores };
    avisos: string[];
}

export interface Plano {
    itens: ItemPlano[];
}

export function planejar(banco: LinhaBanco[], brutas: Record<string, unknown>[]): Plano {
    const porChave = new Map<string, LinhaBanco[]>();
    for (const b of banco) {
        const k = normalizarChave(b.equipKey);
        if (!k) continue;
        porChave.set(k, [...(porChave.get(k) ?? []), b]);
    }

    const lidas = brutas.map(lerLinha);
    const contagem = new Map<string, number>();
    for (const l of lidas) if (l.chave) contagem.set(l.chave, (contagem.get(l.chave) ?? 0) + 1);

    const itens: ItemPlano[] = lidas.map((l): ItemPlano => {
        const base = { linha: l.linha, chave: l.chave, mudancas: [] as Mudanca[], avisos: l.avisos };
        if (!l.chave) return { ...base, acao: "invalida", motivo: "Linha sem Chave_por_equipamento" };
        if ((contagem.get(l.chave) ?? 0) > 1) {
            return { ...base, acao: "duplicada", motivo: "Chave repetida na planilha (o banco só aceita uma linha por chave)" };
        }

        const achadas = porChave.get(l.chave) ?? [];
        if (achadas.length > 1) {
            return { ...base, acao: "invalida", motivo: `${achadas.length} linhas no banco com esta chave; resolva antes` };
        }

        if (achadas.length === 0) {
            if (!l.chaveEstab) return { ...base, acao: "invalida", motivo: "Chave nova sem Chave_por_estabelecimento" };
            if (l.valores.equipment_name === undefined) return { ...base, acao: "invalida", motivo: "Chave nova sem Equipamento" };
            return { ...base, acao: "criar", novo: { equipKey: l.chave, estabKey: l.chaveEstab, valores: l.valores } };
        }

        const db = achadas[0];
        if (db.deletedAt) return { ...base, id: db.id, acao: "excluida_no_sistema", motivo: "Linha excluída no sistema; não é recriada" };
        if (db.lockedBy) return { ...base, id: db.id, acao: "travada", motivo: `Em edição por ${db.lockedBy}` };

        const mudancas: Mudanca[] = [];
        for (const c of CAMPOS) {
            const novo = l.valores[c.coluna];
            if (novo === undefined) continue;
            const atual = canonicoDoBanco(c.coluna, db.valores[c.coluna]);
            if (atual === novo) continue;
            mudancas.push({
                coluna: c.coluna,
                rotulo: c.header,
                de: atual,
                para: novo,
                tipo: atual === null ? "preencher" : "substituir",
            });
        }
        return { ...base, id: db.id, acao: mudancas.length ? "atualizar" : "sem_mudanca", mudancas };
    });

    return { itens };
}

export interface Resumo {
    linhas: number;
    criar: number;
    atualizar: number;
    semMudanca: number;
    travadas: number;
    excluidasNoSistema: number;
    duplicadas: number;
    invalidas: number;
    camposPreenchidos: number;
    camposSubstituidos: number;
}

export function resumir(plano: Plano): Resumo {
    const r: Resumo = {
        linhas: plano.itens.length, criar: 0, atualizar: 0, semMudanca: 0, travadas: 0,
        excluidasNoSistema: 0, duplicadas: 0, invalidas: 0, camposPreenchidos: 0, camposSubstituidos: 0,
    };
    for (const i of plano.itens) {
        switch (i.acao) {
            case "criar": r.criar++; break;
            case "atualizar": r.atualizar++; break;
            case "sem_mudanca": r.semMudanca++; break;
            case "travada": r.travadas++; break;
            case "excluida_no_sistema": r.excluidasNoSistema++; break;
            case "duplicada": r.duplicadas++; break;
            case "invalida": r.invalidas++; break;
        }
        for (const m of i.mudancas) {
            if (m.tipo === "preencher") r.camposPreenchidos++;
            else r.camposSubstituidos++;
        }
    }
    return r;
}

export interface ResumoCampo { coluna: Coluna; rotulo: string; preencher: number; substituir: number }

export function resumirPorCampo(plano: Plano): ResumoCampo[] {
    const mapa = new Map<Coluna, ResumoCampo>();
    for (const i of plano.itens) {
        for (const m of i.mudancas) {
            const r = mapa.get(m.coluna) ?? { coluna: m.coluna, rotulo: m.rotulo, preencher: 0, substituir: 0 };
            if (m.tipo === "preencher") r.preencher++;
            else r.substituir++;
            mapa.set(m.coluna, r);
        }
    }
    return [...mapa.values()].sort((a, b) => b.preencher + b.substituir - (a.preencher + a.substituir));
}
