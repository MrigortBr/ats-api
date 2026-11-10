import { DataSource } from "typeorm";
import { DB_BASE_OPTIONS } from "../db.config";
import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";

/**
 * Atualiza os dados operacionais de Combo a partir da aba
 * "Controle_por_equipamento" da planilha de acompanhamento.
 *
 * A atualização usa `equip_key` (coluna "Chave") e, portanto, não cria
 * equipamentos novos nem depende de pareamento por nome/serial. Para os
 * registros não bloqueados, a planilha é a fonte de verdade dos campos
 * operacionais. Registros bloqueados manualmente (`locked_by`) são preservados.
 *
 * Uso:
 *   npm run seed:combo-atualizacao -- "C:\\caminho\\planilha.xlsx" --dry
 *   npm run seed:combo-atualizacao -- "C:\\caminho\\planilha.xlsx"
 *
 * Sem o caminho, procura a planilha mais recente de Controle de entrega PAC
 * Cirurgia na pasta Downloads do usuário atual.
 */

const ds = new DataSource({
    ...DB_BASE_OPTIONS,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false,
    synchronize: false,
    migrations: [],
});

type Scalar = string | number | boolean | Date | null | undefined;

interface PlanilhaLinha {
    equipKey: string;
    comboCode?: string;
    contract?: string;
    deliveryParcel?: string;
    serialNumber?: string;
    expeditionDate?: string;
    deliveryForecast?: string;
    deliveryDate?: string;
    installationDate?: string;
    trainingDate?: string;
    deliveryStatus?: string;
    equipmentCount?: number;
    nfSent?: boolean;
    nfNumber?: string;
    nfSentDate?: string;
    provisionalReceiptSent?: boolean;
    finalReceiptSent?: boolean;
    nfValue?: number;
    payment1Value?: number;
    payment1Nup?: string;
    payment1SentDate?: string;
    payment2Value?: number;
    payment2Nup?: string;
    payment2SentDate?: string;
    payment2Deadline?: string;
    totalPaid?: number;
    paymentStatus?: string;
}

const H = {
    equipKey: "Chave",
    comboCode: "Combo",
    contract: "Contrato",
    deliveryParcel: "Parcela de Entrega",
    serialNumber: "Nº de Série do Equipamento",
    expeditionDate: "Data de Expedição",
    deliveryForecast: "Previsão de Entrega ao Destinatário",
    deliveryDate: "Data de Entrega Concretizada ao Destinatário",
    installationDate: "Data de Instalação",
    trainingDate: "Data de Capacitação",
    deliveryStatus: "Situação de Entrega",
    equipmentCount: "Quantidade de Equipamentos",
    nfSent: "Enviada Nota Fiscal",
    nfNumber: "Nº NF",
    nfSentDate: "Data de Envio da NF",
    provisionalReceiptSent: "Enviado Termo de Recebimento Provisório",
    finalReceiptSent: "Enviado Termo de Recebimento Definitivo",
    nfValue: "Valor da NF",
    payment1Value: "Valor 1º Pagamento",
    payment1Nup: "NUP 1º Pagamento",
    payment1SentDate: "Data de Envio para Pagamento da 1ª Parcela",
    payment2Value: "Valor 2º Pagamento",
    payment2Nup: "NUP 2º Pagamento",
    payment2SentDate: "Data de Envio para Pagamento da 2ª Parcela",
    payment2Deadline: "Data Final para Pagamento da 2ª Parcela",
    totalPaid: "Valor Total Pago",
    paymentStatus: "Status Pagamento",
} as const;

function cellValue(cell: ExcelJS.Cell): Scalar {
    const value = cell.value as unknown;
    if (value instanceof Date) return value;
    if (value && typeof value === "object") {
        if ("result" in value) return (value as { result?: Scalar }).result;
        if ("richText" in value) {
            return (value as { richText?: Array<{ text?: string }> }).richText
                ?.map(part => part.text ?? "")
                .join("") || undefined;
        }
        if ("text" in value && typeof (value as { text?: unknown }).text === "string") {
            return (value as { text: string }).text;
        }
        return undefined;
    }
    return value as Scalar;
}

function text(value: Scalar): string | undefined {
    if (value == null || value === "") return undefined;
    if (value instanceof Date) {
        const day = String(value.getUTCDate()).padStart(2, "0");
        const month = String(value.getUTCMonth() + 1).padStart(2, "0");
        return `${day}/${month}/${value.getUTCFullYear()}`;
    }
    return String(value).trim() || undefined;
}

function number(value: Scalar): number | undefined {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    const raw = text(value);
    if (!raw) return undefined;
    const normalized = raw
        .replace(/R\$/gi, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function boolean(value: Scalar): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    const raw = text(value)?.toLocaleLowerCase("pt-BR");
    if (!raw) return undefined;
    if (["sim", "s", "true", "1", "x"].includes(raw)) return true;
    if (["não", "nao", "n", "false", "0"].includes(raw)) return false;
    return undefined;
}

function normalizarCabecalho(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleLowerCase("pt-BR");
}

function colunasDaPlanilha(worksheet: ExcelJS.Worksheet): Record<keyof typeof H, number> {
    const header = worksheet.getRow(1);
    const indices = new Map<string, number>();
    header.eachCell({ includeEmpty: false }, (cell, column) => {
        const value = text(cellValue(cell));
        if (value) indices.set(normalizarCabecalho(value), column);
    });

    const result = {} as Record<keyof typeof H, number>;
    for (const [field, name] of Object.entries(H) as [keyof typeof H, string][]) {
        const column = indices.get(normalizarCabecalho(name));
        if (!column) throw new Error(`Coluna obrigatória não encontrada: "${name}".`);
        result[field] = column;
    }
    return result;
}

function linha(row: ExcelJS.Row, columns: Record<keyof typeof H, number>): PlanilhaLinha | null {
    const get = (field: keyof typeof H) => cellValue(row.getCell(columns[field]));
    const equipKey = text(get("equipKey"));
    if (!equipKey) return null;

    return {
        equipKey,
        comboCode: text(get("comboCode")),
        contract: text(get("contract")),
        deliveryParcel: text(get("deliveryParcel")),
        serialNumber: text(get("serialNumber")),
        expeditionDate: text(get("expeditionDate")),
        deliveryForecast: text(get("deliveryForecast")),
        deliveryDate: text(get("deliveryDate")),
        installationDate: text(get("installationDate")),
        trainingDate: text(get("trainingDate")),
        deliveryStatus: text(get("deliveryStatus")),
        equipmentCount: number(get("equipmentCount")),
        nfSent: boolean(get("nfSent")),
        nfNumber: text(get("nfNumber")),
        nfSentDate: text(get("nfSentDate")),
        provisionalReceiptSent: boolean(get("provisionalReceiptSent")),
        finalReceiptSent: boolean(get("finalReceiptSent")),
        nfValue: number(get("nfValue")),
        payment1Value: number(get("payment1Value")),
        payment1Nup: text(get("payment1Nup")),
        payment1SentDate: text(get("payment1SentDate")),
        payment2Value: number(get("payment2Value")),
        payment2Nup: text(get("payment2Nup")),
        payment2SentDate: text(get("payment2SentDate")),
        payment2Deadline: text(get("payment2Deadline")),
        totalPaid: number(get("totalPaid")),
        paymentStatus: text(get("paymentStatus")),
    };
}

function arquivoEntrada(): string {
    const arg = process.argv.slice(2).find(value => value !== "--dry");
    if (arg) return path.resolve(arg);

    const downloads = path.join(process.env.USERPROFILE ?? "", "Downloads");
    const candidates = fs.existsSync(downloads)
        ? fs.readdirSync(downloads)
            .filter(name => /^Planilha de Controle de entrega Pac Cirurgia.*\.xlsx$/i.test(name))
            .map(name => ({ name, modified: fs.statSync(path.join(downloads, name)).mtimeMs }))
            .sort((a, b) => b.modified - a.modified)
        : [];
    if (!candidates[0]) {
        throw new Error("Informe o caminho da planilha .xlsx como primeiro argumento.");
    }
    return path.join(downloads, candidates[0].name);
}

async function main(): Promise<void> {
    const dry = process.argv.includes("--dry");
    const arquivo = arquivoEntrada();
    if (!fs.existsSync(arquivo)) throw new Error(`Arquivo não encontrado: ${arquivo}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(arquivo);
    const worksheet = workbook.getWorksheet("Controle_por_equipamento");
    if (!worksheet) throw new Error('Aba "Controle_por_equipamento" não encontrada.');

    const columns = colunasDaPlanilha(worksheet);
    const linhas: PlanilhaLinha[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, index) => {
        if (index < 2) return;
        const item = linha(row, columns);
        if (item) linhas.push(item);
    });
    if (!linhas.length) throw new Error("Nenhum equipamento válido foi encontrado na planilha.");

    await ds.initialize();
    console.log(`Conectado. ${dry ? "Modo --dry: nenhuma alteração será gravada." : ""}`);
    console.log(`Planilha: ${arquivo}`);
    console.log(`Linhas com chave: ${linhas.length}`);

    let atualizados = 0;
    let bloqueados = 0;
    const ausentes: string[] = [];
    const equipamentosNoBanco: Array<{ id: string; equip_key: string; locked_by: string | null }> = await ds.query(
        `SELECT id, equip_key, locked_by
         FROM combo_consult
         WHERE equip_key = ANY($1) AND deleted_at IS NULL`,
        [linhas.map(item => item.equipKey)],
    );
    const porChave = new Map(equipamentosNoBanco.map(item => [item.equip_key, item]));
    const pendentes: Array<{ id: string; item: PlanilhaLinha }> = [];

    for (const item of linhas) {
        const existing = porChave.get(item.equipKey);
        if (!existing) {
            ausentes.push(item.equipKey);
            continue;
        }
        if (existing.locked_by) {
            bloqueados++;
            continue;
        }
        pendentes.push({ id: existing.id, item });
    }

    if (!dry) {
        const tamanhoDoLote = 25;
        for (let inicio = 0; inicio < pendentes.length; inicio += tamanhoDoLote) {
            const lote = pendentes.slice(inicio, inicio + tamanhoDoLote);
            await Promise.all(lote.map(({ id, item }) =>
                ds.query(
                    `UPDATE combo_consult SET
                        combo_code = $2,
                        contract = $3,
                        delivery_parcel = $4,
                        serial_number = $5,
                        expedition_date = $6,
                        delivery_forecast = $7,
                        delivery_date = $8,
                        installation_date = $9,
                        training_date = $10,
                        delivery_status = $11,
                        equipment_count = $12,
                        nf_sent = $13,
                        nf_number = $14,
                        nf_sent_date = $15,
                        provisional_receipt_sent = $16,
                        final_receipt_sent = $17,
                        nf_value = $18,
                        payment1_value = $19,
                        payment1_nup = $20,
                        payment1_sent_date = $21,
                        payment2_value = $22,
                        payment2_nup = $23,
                        payment2_sent_date = $24,
                        payment2_deadline = $25,
                        total_paid = $26,
                        payment_status = $27,
                        updated_at = NOW()
                     WHERE id = $1`,
                    [
                        id,
                        item.comboCode, item.contract, item.deliveryParcel, item.serialNumber,
                        item.expeditionDate, item.deliveryForecast, item.deliveryDate,
                        item.installationDate, item.trainingDate, item.deliveryStatus,
                        item.equipmentCount, item.nfSent, item.nfNumber, item.nfSentDate,
                        item.provisionalReceiptSent, item.finalReceiptSent, item.nfValue,
                        item.payment1Value, item.payment1Nup, item.payment1SentDate,
                        item.payment2Value, item.payment2Nup, item.payment2SentDate,
                        item.payment2Deadline, item.totalPaid, item.paymentStatus,
                    ],
                ),
            ));
            atualizados += lote.length;
        }
    } else {
        atualizados = pendentes.length;
    }

    console.log(`\n${dry ? "Seriam atualizados" : "Atualizados"}: ${atualizados}`);
    console.log(`Ignorados por bloqueio manual: ${bloqueados}`);
    console.log(`Não encontrados no banco: ${ausentes.length}`);
    if (ausentes.length) console.warn(`  ${ausentes.slice(0, 30).join("\n  ")}${ausentes.length > 30 ? "\n  ..." : ""}`);
    await ds.destroy();
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
