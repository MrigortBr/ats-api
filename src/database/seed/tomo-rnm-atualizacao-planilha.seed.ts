import { DataSource } from "typeorm";
import { DB_BASE_OPTIONS } from "../db.config";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

/**
 * Atualiza os dados de TOMO e RNM a partir das abas de seleção da planilha
 * Controle Tomografia e Ressonância. O vínculo é sempre feito pelo CNES.
 *
 * A coluna "Data Estimada/MS Entrega Equipamento" é o campo de referência de
 * entrega usado atualmente pelos dois módulos. A planilha não traz uma data
 * de entrega efetivamente realizada; por isso ela não é inferida aqui.
 *
 * Uso:
 *   npm run seed:tomo-rnm-atualizacao -- "C:\\caminho\\Controle Tomografia e Ressonância.xlsx" --dry
 *   npm run seed:tomo-rnm-atualizacao -- "C:\\caminho\\Controle Tomografia e Ressonância.xlsx"
 */

const ds = new DataSource({
    ...DB_BASE_OPTIONS,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false,
    synchronize: false,
    migrations: [],
});

type Modulo = "tomo" | "rnm";

interface LinhaPlanilha {
    cnes: string;
    cnpj?: string;
    gestao?: string;
    naturezaJuridica?: string;
    status?: string;
    contract?: string;
    deliveryDate?: string;
}

interface CampoSource {
    cnes: string;
    cnpj: string;
    gestao: string;
    naturezaJuridica: string;
    status: string;
    contract: string;
    deliveryDate: string;
}

const TOMO: CampoSource = {
    cnes: "CNES",
    cnpj: "CNPJ",
    gestao: "Tipo de Gestão",
    naturezaJuridica: "Natureza Jurídica/Categoria",
    status: "Status Seleção",
    contract: "Previsão de Entrega (Etapa)",
    deliveryDate: "Data Estimada/MS Entrega Equipamento",
};

const RNM: CampoSource = {
    cnes: "CNES",
    cnpj: "CNPJ",
    gestao: "Tipo de Gestão",
    naturezaJuridica: "Natureza Jurídica/Categoria",
    // No RNM, o campo de status exibido pelo painel já representa a etapa do contrato.
    status: "Previsão de Entrega (Etapa)",
    contract: "",
    deliveryDate: "Data Estimada/MS Entrega Equipamento",
};

function normalizar(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleLowerCase("pt-BR");
}

function texto(value: unknown): string | undefined {
    if (value == null) return undefined;
    const resultado = String(value).replace(/\u00a0/g, " ").trim();
    return resultado || undefined;
}

function cnes(value: unknown): string | undefined {
    const digits = texto(value)?.replace(/\D/g, "");
    return digits ? digits.padStart(7, "0") : undefined;
}

function gestao(value: unknown): string | undefined {
    const raw = normalizar(texto(value) ?? "");
    if (!raw) return undefined;
    if (raw === "e" || raw.startsWith("estadual")) return "E";
    if (raw === "m" || raw.startsWith("municipal")) return "M";
    if (raw === "d" || raw.startsWith("dupla")) return "D";
    return undefined;
}

function statusTomo(value: unknown): string | undefined {
    const original = texto(value);
    const raw = normalizar(original ?? "");
    if (!raw) return undefined;
    if (raw.includes("selecion")) return "SELECIONADO";
    if (raw.includes("reserva") || raw.includes("espera")) return "ESPERA";
    if (raw === "novo") return "NOVO";
    return original?.toUpperCase();
}

/** Número de série do Excel -> dd/mm/aaaa (UTC, sem depender de fuso nem do formato da célula). */
function dataDeSerial(serial: number): string | undefined {
    if (!Number.isFinite(serial) || serial < 20_000 || serial > 80_000) return undefined;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** Texto digitado na célula: dd/mm/aa vira dd/mm/aaaa; o resto passa sem mudar. */
function data(value: unknown): string | undefined {
    const raw = texto(value);
    if (!raw) return undefined;
    const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (!match) return raw;
    const [, day, month, year] = match;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/20${year}`;
}

/**
 * Data de entrega: se a célula é uma data do Excel, usa o número de série (sem ambiguidade de formato);
 * se é texto, usa o texto. O texto formatado pelo XLSX sai como m/d/aa e não serve para isso.
 */
function dataDaCelula(sheet: XLSX.WorkSheet, linha: number, coluna: number, formatado: unknown): string | undefined {
    const cell = sheet[XLSX.utils.encode_cell({ r: linha, c: coluna })] as XLSX.CellObject | undefined;
    if (cell && cell.t === "n" && typeof cell.v === "number") {
        const d = dataDeSerial(cell.v);
        if (d) return d;
    }
    return data(formatado);
}

const PASTAS_IGNORADAS = new Set(["node_modules", ".git", ".next", "dist", "build", "AppData"]);

function nomeCompativel(nome: string): boolean {
    if (nome.startsWith("~$") || !/\.xlsx?m?$/i.test(nome)) return false;
    const n = normalizar(nome);
    return (n.includes("tomograf") && n.includes("ressonan")) || n.startsWith("controle tomografia");
}

function varrer(pasta: string, profundidade: number, achados: Map<string, number>): void {
    let itens: fs.Dirent[];
    try { itens = fs.readdirSync(pasta, { withFileTypes: true }); } catch { return; }
    for (const item of itens) {
        const caminho = path.join(pasta, item.name);
        if (item.isDirectory()) {
            if (profundidade > 0 && !PASTAS_IGNORADAS.has(item.name)) varrer(caminho, profundidade - 1, achados);
        } else if (nomeCompativel(item.name)) {
            try { achados.set(caminho, fs.statSync(caminho).mtimeMs); } catch { /* ignora */ }
        }
    }
}

function temAsAbas(arquivo: string): boolean {
    try {
        const nomes = XLSX.readFile(arquivo, { bookSheets: true }).SheetNames;
        return nomes.includes("Seleção_Tomográfos") && nomes.includes("Seleção_Ressonância");
    } catch { return false; }
}

/** Procura a planilha em Downloads, Desktop, Documents, OneDrive e na pasta do projeto; usa a mais recente com as duas abas. */
function localizarPlanilha(): string {
    const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
    const raizes = new Set<string>([process.cwd(), path.resolve(process.cwd(), "..")]);
    for (const pasta of ["Downloads", "Desktop", "Documents"]) raizes.add(path.join(home, pasta));
    try {
        for (const nome of fs.readdirSync(home)) {
            if (!/^OneDrive/i.test(nome)) continue;
            raizes.add(path.join(home, nome));
            for (const pasta of ["Desktop", "Documents", "Downloads", "Área de Trabalho", "Documentos"]) raizes.add(path.join(home, nome, pasta));
        }
    } catch { /* sem home legível */ }

    const achados = new Map<string, number>();
    for (const raiz of raizes) varrer(raiz, 2, achados);
    const ordenados = [...achados.entries()].sort((a, b) => b[1] - a[1]).map(([caminho]) => caminho);
    const valido = ordenados.find(temAsAbas);
    if (!valido) {
        throw new Error(
            "Não achei a planilha (nome com 'Tomografia' e 'Ressonância', abas Seleção_Tomográfos e Seleção_Ressonância).\n" +
            `Procurei em: ${[...raizes].join("; ")}\nPasse o caminho: npm run seed:tomo-rnm-atualizacao -- "C:\\pasta\\arquivo.xlsx"`,
        );
    }
    if (ordenados.length > 1) console.log(`Planilhas encontradas (usando a mais recente com as abas certas):\n  ${ordenados.slice(0, 5).join("\n  ")}`);
    return valido;
}

function arquivoInformado(): string | undefined {
    // Junta os pedaços caso o shell tenha separado o caminho por causa dos espaços.
    const bruto = process.argv.slice(2).filter(arg => !arg.startsWith("--")).join(" ").trim().replace(/^["']|["']$/g, "");
    return bruto ? path.resolve(bruto) : undefined;
}

function lerAba(workbook: XLSX.WorkBook, aba: string, campos: CampoSource, modulo: Modulo): LinhaPlanilha[] {
    const sheet = workbook.Sheets[aba];
    if (!sheet) throw new Error(`Aba "${aba}" não encontrada.`);

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
    const header = rows[1];
    if (!header) throw new Error(`Cabeçalho não encontrado na aba "${aba}".`);

    const columns = new Map<string, number>();
    header.forEach((value, index) => {
        const label = texto(value);
        if (label) columns.set(normalizar(label), index);
    });
    const col = (label: string, required = true): number | undefined => {
        if (!label) return undefined;
        const index = columns.get(normalizar(label));
        if (index === undefined && required) throw new Error(`Coluna "${label}" não encontrada na aba "${aba}".`);
        return index;
    };

    const indices = {
        cnes: col(campos.cnes)!,
        cnpj: col(campos.cnpj),
        gestao: col(campos.gestao),
        naturezaJuridica: col(campos.naturezaJuridica),
        status: col(campos.status),
        contract: col(campos.contract, false),
        deliveryDate: col(campos.deliveryDate),
    };

    const faixa = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
    return rows.slice(2).flatMap((row, i) => {
        const codigo = cnes(row[indices.cnes]);
        if (!codigo) return [];
        return [{
            cnes: codigo,
            cnpj: indices.cnpj === undefined ? undefined : texto(row[indices.cnpj]),
            gestao: indices.gestao === undefined ? undefined : gestao(row[indices.gestao]),
            naturezaJuridica: indices.naturezaJuridica === undefined ? undefined : texto(row[indices.naturezaJuridica]),
            status: indices.status === undefined ? undefined : modulo === "tomo"
                ? statusTomo(row[indices.status])
                : texto(row[indices.status]),
            contract: indices.contract === undefined ? undefined : texto(row[indices.contract]),
            deliveryDate: indices.deliveryDate === undefined
                ? undefined
                : dataDaCelula(sheet, faixa.s.r + 2 + i, faixa.s.c + indices.deliveryDate, row[indices.deliveryDate]),
        }];
    });
}

async function atualizar(modulo: Modulo, linhas: LinhaPlanilha[], dry: boolean): Promise<void> {
    const table = modulo === "tomo" ? "hospital_tomo" : "hospital_rnm";
    const registros: Array<{ id: number; cnes: string; deliveryDate: string | null }> = await ds.query(
        `SELECT x.id, h.cnes, x.delivery_date AS "deliveryDate"
         FROM ${table} x
         INNER JOIN hospital h ON h.id = x.hospital_id
         WHERE x.deleted_at IS NULL AND h.deleted_at IS NULL AND h.cnes = ANY($1)`,
        [linhas.map(item => item.cnes)],
    );
    const porCnes = new Map(registros.map(item => [item.cnes, item]));
    const ausentes = linhas.filter(item => !porCnes.has(item.cnes));
    const pendentes = linhas.filter(item => porCnes.has(item.cnes));

    if (!dry) {
        const lote = 25;
        for (let index = 0; index < pendentes.length; index += lote) {
            await Promise.all(pendentes.slice(index, index + lote).map(async item => {
                const existing = porCnes.get(item.cnes)!;
                await ds.query(
                    `UPDATE ${table} SET
                        status = COALESCE(NULLIF($2, ''), status),
                        contract = COALESCE(NULLIF($3, ''), contract),
                        delivery_date = COALESCE(NULLIF($4, ''), delivery_date),
                        updated_at = NOW()
                     WHERE id = $1`,
                    [existing.id, item.status ?? "", item.contract ?? "", item.deliveryDate ?? ""],
                );
                await ds.query(
                    `UPDATE hospital SET
                        cnpj = COALESCE(NULLIF($2, ''), cnpj),
                        gestao = COALESCE(NULLIF($3, ''), gestao),
                        natureza_juridica = COALESCE(NULLIF($4, ''), natureza_juridica)
                     WHERE id = (SELECT hospital_id FROM ${table} WHERE id = $1)`,
                    [existing.id, item.cnpj ?? "", item.gestao ?? "", item.naturezaJuridica ?? ""],
                );
            }));
        }
    }

    const mudancasData = pendentes.filter(item => item.deliveryDate && item.deliveryDate !== porCnes.get(item.cnes)!.deliveryDate);
    console.log(`\n${modulo.toUpperCase()}`);
    console.log(`${dry ? "Seriam atualizados" : "Atualizados"}: ${pendentes.length}`);
    console.log(`Datas de entrega que mudam: ${mudancasData.length}`);
    for (const item of mudancasData.slice(0, 80)) {
        console.log(`  ${item.cnes}: ${porCnes.get(item.cnes)!.deliveryDate ?? "(vazio)"} -> ${item.deliveryDate}`);
    }
    console.log(`CNES da planilha sem registro ${modulo.toUpperCase()} no banco: ${ausentes.length}`);
    if (ausentes.length) console.log(ausentes.map(item => item.cnes).join(", "));
}

async function main(): Promise<void> {
    const dry = process.argv.includes("--dry");
    const informado = arquivoInformado();
    if (informado && !fs.existsSync(informado)) console.warn(`Arquivo informado não existe (${informado}); procurando sozinho...`);
    const arquivo = informado && fs.existsSync(informado) ? informado : localizarPlanilha();

    const workbook = XLSX.readFile(arquivo);
    const tomo = lerAba(workbook, "Seleção_Tomográfos", TOMO, "tomo");
    const rnm = lerAba(workbook, "Seleção_Ressonância", RNM, "rnm");
    if (!tomo.length || !rnm.length) throw new Error("Nenhuma linha válida foi encontrada nas abas TOMO/RNM.");

    await ds.initialize();
    console.log(`Planilha: ${arquivo}`);
    console.log(`${dry ? "Modo --dry: nenhuma alteração será gravada." : "Atualização em execução."}`);
    console.log(`Linhas TOMO: ${tomo.length}; linhas RNM: ${rnm.length}`);
    await atualizar("tomo", tomo, dry);
    await atualizar("rnm", rnm, dry);
    await ds.destroy();
}

main().catch(async error => {
    if (ds.isInitialized) await ds.destroy();
    console.error(error);
    process.exit(1);
});
