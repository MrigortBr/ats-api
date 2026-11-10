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

function data(value: unknown): string | undefined {
    const raw = texto(value);
    if (!raw) return undefined;
    const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (!match) return raw;
    const [, day, month, year] = match;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/20${year}`;
}

function arquivoEntrada(): string {
    const arg = process.argv.slice(2).find(value => value !== "--dry");
    if (arg) return path.resolve(arg);

    const downloads = path.join(process.env.USERPROFILE ?? "", "Downloads");
    const candidates = fs.existsSync(downloads)
        ? fs.readdirSync(downloads)
            .filter(name => /^Controle Tomografia e Ressonância.*\.xlsx$/i.test(name))
            .map(name => ({ name, modified: fs.statSync(path.join(downloads, name)).mtimeMs }))
            .sort((a, b) => b.modified - a.modified)
        : [];
    if (!candidates[0]) throw new Error("Informe o caminho da planilha .xlsx como primeiro argumento.");
    return path.join(downloads, candidates[0].name);
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

    return rows.slice(2).flatMap(row => {
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
            deliveryDate: indices.deliveryDate === undefined ? undefined : data(row[indices.deliveryDate]),
        }];
    });
}

async function atualizar(modulo: Modulo, linhas: LinhaPlanilha[], dry: boolean): Promise<void> {
    const table = modulo === "tomo" ? "hospital_tomo" : "hospital_rnm";
    const registros: Array<{ id: number; cnes: string }> = await ds.query(
        `SELECT x.id, h.cnes
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

    console.log(`\n${modulo.toUpperCase()}`);
    console.log(`${dry ? "Seriam atualizados" : "Atualizados"}: ${pendentes.length}`);
    console.log(`CNES da planilha sem registro ${modulo.toUpperCase()} no banco: ${ausentes.length}`);
    if (ausentes.length) console.log(ausentes.map(item => item.cnes).join(", "));
}

async function main(): Promise<void> {
    const dry = process.argv.includes("--dry");
    const arquivo = arquivoEntrada();
    if (!fs.existsSync(arquivo)) throw new Error(`Arquivo não encontrado: ${arquivo}`);

    const workbook = XLSX.readFile(arquivo, { cellDates: true });
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
