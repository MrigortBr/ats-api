import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import ExcelJS from "exceljs";
import { stat } from "fs/promises";
import * as path from "path";

/**
 * Le a aba "Tabelona" da planilha de aceleradores lineares.
 *
 * Antes isso era uma rota do frontend (Next) que lia o arquivo de public/ — sem
 * autenticacao e com a planilha baixavel por URL direta. Agora a planilha fica
 * fora de qualquer pasta publica (api-ats/data/) e so e servida pela API, com login.
 *
 * Caminho configuravel por ACELERADORES_XLSX (padrao: <cwd>/data/Tabelona_Aceleradores.xlsx).
 * O resultado fica em cache e e relido automaticamente quando o arquivo muda.
 */

const SHEET_NAME = "Tabelona";

// label na planilha -> chave no JSON de resposta
const COLS = {
    cnes: "CNES",
    servico: "SERVIÇO",
    uf: "UF",
    macro: "MACRORREGIÃO",
    naturezaJuridica: "NATUREZA JURÍDICA",
    gestao: "GESTÃO",
    municipio: "MUNICÍPIO",
    novosCasosCancer: "NOVOS CASOS DE CÂNCER/MACRORREGIÃO",
    modo: "MODO DE AQUISIÇÃO",
    acelOperacionais: "Nº ACEL. OPERACIONAIS",
    vagasSusMes: "VAGAS SUS/MÊS - SIMRAD",
    vagasPorAcelerador: "VAGAS / ACELERADOR (operac.) SIMRAD",
    mesAnoLo: "MÊS/ANO DA LO",
    obs: "OBS",
    tempoPosLo: "TEMPO PÓS-LO (meses)",
    primeiraProducao: "1ª PRODUÇÃO (mês/ano)",
    prodAntes: "PROD. ANTES DA LO (freq)",
    prodDepois: "PROD. DEPOIS DA LO (freq)",
    variacao: "VARIAÇÃO % APÓS LO",
    prod2024: "PROD. 2024 (freq)",
    prod2025: "PROD. 2025 (freq)",
    prod2026JanJun: "PROD. 2026 jan–jun (freq)",
    projecao2026: "PROJEÇÃO 2026 (anualiz.)",
    valor2025: "VALOR 2025 (R$)",
    valor2026JanJun: "VALOR 2026 jan–jun (R$)",
    projecaoValor2026: "PROJEÇÃO VALOR 2026 (R$)",
} as const;

// Colunas essenciais — se alguma sumir da planilha, a resposta falha.
const REQUIRED_COLS: (keyof typeof COLS)[] = [
    "cnes", "servico", "uf", "macro", "municipio", "modo", "obs", "prodAntes", "prodDepois", "variacao",
];

export interface AceleradorRow {
    cnes: string;
    servico: string;
    uf: string;
    macro: string;
    naturezaJuridica: string | null;
    gestao: string | null;
    municipio: string;
    novosCasosCancer: number | null;
    modo: string;
    acelOperacionais: string | null;
    vagasSusMes: string | null;
    vagasPorAcelerador: string | null;
    mesAnoLo: string | null;
    obs: string | null;
    tempoPosLo: number | null;
    primeiraProducao: string | null;
    prodAntes: number | null;
    prodDepois: number | null;
    /** Ja em fracao (ex.: 1.34 = +134%); a pagina multiplica por 100 na exibicao. */
    variacaoPct: number | null;
    prod2024: number | null;
    prod2025: number | null;
    prod2026JanJun: number | null;
    projecao2026: number | null;
    valor2025: number | null;
    valor2026JanJun: number | null;
    projecaoValor2026: number | null;
}

function extractValue(v: ExcelJS.CellValue): string | number | null {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "object") {
        if ("result" in v) return extractValue((v as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
        if ("richText" in v) return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join("");
        if ("text" in v) return String((v as { text: unknown }).text);
        return null;
    }
    if (typeof v === "boolean") return String(v);
    return v;
}

function asString(v: ExcelJS.CellValue): string {
    const val = extractValue(v);
    return val === null || val === undefined ? "" : String(val).trim();
}

function asNumber(v: ExcelJS.CellValue): number | null {
    const val = extractValue(v);
    if (val === null || val === undefined || val === "") return null;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : null;
}

export function caminhoPlanilha(env: NodeJS.ProcessEnv = process.env): string {
    return env.ACELERADORES_XLSX?.trim() || path.join(process.cwd(), "data", "Tabelona_Aceleradores.xlsx");
}

@Injectable()
export class AceleradoresService {
    private readonly logger = new Logger(AceleradoresService.name);
    private cache: { mtimeMs: number; rows: AceleradorRow[] } | null = null;

    async listar(): Promise<{ rows: AceleradorRow[]; count: number }> {
        const arquivo = caminhoPlanilha();
        let mtimeMs: number;
        try {
            mtimeMs = (await stat(arquivo)).mtimeMs;
        } catch {
            this.logger.error(`Planilha de aceleradores nao encontrada em ${arquivo}`);
            throw new InternalServerErrorException("Planilha de aceleradores não encontrada no servidor.");
        }

        if (!this.cache || this.cache.mtimeMs !== mtimeMs) {
            this.cache = { mtimeMs, rows: await this.lerPlanilha(arquivo) };
        }
        return { rows: this.cache.rows, count: this.cache.rows.length };
    }

    private async lerPlanilha(arquivo: string): Promise<AceleradorRow[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(arquivo);

        const sheet = workbook.getWorksheet(SHEET_NAME);
        if (!sheet) throw new InternalServerErrorException(`Aba "${SHEET_NAME}" não encontrada na planilha.`);

        // Acha a linha de cabecalho procurando a celula "CNES" na coluna A
        let headerRowNumber = -1;
        sheet.eachRow((row, rowNumber) => {
            if (headerRowNumber === -1 && asString(row.getCell(1).value) === "CNES") headerRowNumber = rowNumber;
        });
        if (headerRowNumber === -1) {
            throw new InternalServerErrorException(`Linha de cabeçalho não encontrada na aba "${SHEET_NAME}".`);
        }

        const colIndex: Partial<Record<keyof typeof COLS, number>> = {};
        sheet.getRow(headerRowNumber).eachCell((cell, colNumber) => {
            const label = asString(cell.value);
            const key = (Object.keys(COLS) as (keyof typeof COLS)[]).find((k) => COLS[k] === label);
            if (key) colIndex[key] = colNumber;
        });

        const missing = REQUIRED_COLS.filter((key) => !colIndex[key]);
        if (missing.length > 0) {
            throw new InternalServerErrorException(
                `Colunas obrigatórias não encontradas na planilha: ${missing.map((k) => COLS[k]).join(", ")}`,
            );
        }

        const cell = (row: ExcelJS.Row, key: keyof typeof COLS) => {
            const idx = colIndex[key];
            return idx ? row.getCell(idx).value : null;
        };

        const rows: AceleradorRow[] = [];
        for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
            const row = sheet.getRow(r);
            const cnes = asString(cell(row, "cnes"));
            if (!cnes) continue; // ignora linhas em branco

            rows.push({
                cnes,
                servico: asString(cell(row, "servico")),
                uf: asString(cell(row, "uf")),
                macro: asString(cell(row, "macro")),
                naturezaJuridica: asString(cell(row, "naturezaJuridica")) || null,
                gestao: asString(cell(row, "gestao")) || null,
                municipio: asString(cell(row, "municipio")),
                novosCasosCancer: asNumber(cell(row, "novosCasosCancer")),
                modo: asString(cell(row, "modo")),
                acelOperacionais: asString(cell(row, "acelOperacionais")) || null,
                vagasSusMes: asString(cell(row, "vagasSusMes")) || null,
                vagasPorAcelerador: asString(cell(row, "vagasPorAcelerador")) || null,
                mesAnoLo: asString(cell(row, "mesAnoLo")) || null,
                obs: asString(cell(row, "obs")) || null,
                tempoPosLo: asNumber(cell(row, "tempoPosLo")),
                primeiraProducao: asString(cell(row, "primeiraProducao")) || null,
                prodAntes: asNumber(cell(row, "prodAntes")),
                prodDepois: asNumber(cell(row, "prodDepois")),
                variacaoPct: asNumber(cell(row, "variacao")),
                prod2024: asNumber(cell(row, "prod2024")),
                prod2025: asNumber(cell(row, "prod2025")),
                prod2026JanJun: asNumber(cell(row, "prod2026JanJun")),
                projecao2026: asNumber(cell(row, "projecao2026")),
                valor2025: asNumber(cell(row, "valor2025")),
                valor2026JanJun: asNumber(cell(row, "valor2026JanJun")),
                projecaoValor2026: asNumber(cell(row, "projecaoValor2026")),
            });
        }
        return rows;
    }
}
