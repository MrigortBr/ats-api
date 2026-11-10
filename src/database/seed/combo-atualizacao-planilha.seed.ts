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
 * equipamentos novos nem depende de pareamento por nome/serial. Registros
 * bloqueados manualmente (`locked_by`) são preservados.
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

const C = {
    equipKey: 1,
    comboCode: 2,
    contract: 14,
    deliveryParcel: 15,
    serialNumber: 17,
    expeditionDate: 18,
    deliveryForecast: 19,
    deliveryDate: 20,
    installationDate: 21,
    trainingDate: 22,
    deliveryStatus: 23,
    equipmentCount: 24,
    nfSent: 25,
    nfNumber: 26,
    nfSentDate: 27,
    provisionalReceiptSent: 28,
    finalReceiptSent: 29,
    nfValue: 30,
    payment1Value: 31,
    payment1Nup: 32,
    payment1SentDate: 33,
    payment2Value: 34,
    payment2Nup: 35,
    payment2SentDate: 36,
    payment2Deadline: 37,
    totalPaid: 38,
    paymentStatus: 39,
} as const;

function cellValue(cell: ExcelJS.Cell): Scalar {
    const value = cell.value as unknown;
    if (value && typeof value === "object" && "result" in value) {
        return (value as { result?: Scalar }).result;
    }
    return value as Scalar;
}

function text(value: Scalar): string | undefined {
    if (value == null || value === "") return undefined;
    if (value instanceof Date) {
        const day = String(value.getDate()).padStart(2, "0");
        const month = String(value.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}/${value.getFullYear()}`;
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

function linha(row: ExcelJS.Row): PlanilhaLinha | null {
    const get = (column: number) => cellValue(row.getCell(column));
    const equipKey = text(get(C.equipKey));
    if (!equipKey) return null;

    return {
        equipKey,
        comboCode: text(get(C.comboCode)),
        contract: text(get(C.contract)),
        deliveryParcel: text(get(C.deliveryParcel)),
        serialNumber: text(get(C.serialNumber)),
        expeditionDate: text(get(C.expeditionDate)),
        deliveryForecast: text(get(C.deliveryForecast)),
        deliveryDate: text(get(C.deliveryDate)),
        installationDate: text(get(C.installationDate)),
        trainingDate: text(get(C.trainingDate)),
        deliveryStatus: text(get(C.deliveryStatus)),
        equipmentCount: number(get(C.equipmentCount)),
        nfSent: boolean(get(C.nfSent)),
        nfNumber: text(get(C.nfNumber)),
        nfSentDate: text(get(C.nfSentDate)),
        provisionalReceiptSent: boolean(get(C.provisionalReceiptSent)),
        finalReceiptSent: boolean(get(C.finalReceiptSent)),
        nfValue: number(get(C.nfValue)),
        payment1Value: number(get(C.payment1Value)),
        payment1Nup: text(get(C.payment1Nup)),
        payment1SentDate: text(get(C.payment1SentDate)),
        payment2Value: number(get(C.payment2Value)),
        payment2Nup: text(get(C.payment2Nup)),
        payment2SentDate: text(get(C.payment2SentDate)),
        payment2Deadline: text(get(C.payment2Deadline)),
        totalPaid: number(get(C.totalPaid)),
        paymentStatus: text(get(C.paymentStatus)),
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

    const linhas: PlanilhaLinha[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, index) => {
        if (index < 2) return;
        const item = linha(row);
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

    for (const item of linhas) {
        const existing = await ds.query(
            `SELECT id, locked_by FROM combo_consult WHERE equip_key = $1 AND deleted_at IS NULL`,
            [item.equipKey],
        );
        if (!existing.length) {
            ausentes.push(item.equipKey);
            continue;
        }
        if (existing[0].locked_by) {
            bloqueados++;
            continue;
        }

        if (!dry) {
            await ds.query(
                `UPDATE combo_consult SET
                    combo_code = COALESCE($2, combo_code),
                    contract = COALESCE($3, contract),
                    delivery_parcel = COALESCE($4, delivery_parcel),
                    serial_number = COALESCE($5, serial_number),
                    expedition_date = COALESCE($6, expedition_date),
                    delivery_forecast = COALESCE($7, delivery_forecast),
                    delivery_date = COALESCE($8, delivery_date),
                    installation_date = COALESCE($9, installation_date),
                    training_date = COALESCE($10, training_date),
                    delivery_status = COALESCE($11, delivery_status),
                    equipment_count = COALESCE($12, equipment_count),
                    nf_sent = COALESCE($13, nf_sent),
                    nf_number = COALESCE($14, nf_number),
                    nf_sent_date = COALESCE($15, nf_sent_date),
                    provisional_receipt_sent = COALESCE($16, provisional_receipt_sent),
                    final_receipt_sent = COALESCE($17, final_receipt_sent),
                    nf_value = COALESCE($18, nf_value),
                    payment1_value = COALESCE($19, payment1_value),
                    payment1_nup = COALESCE($20, payment1_nup),
                    payment1_sent_date = COALESCE($21, payment1_sent_date),
                    payment2_value = COALESCE($22, payment2_value),
                    payment2_nup = COALESCE($23, payment2_nup),
                    payment2_sent_date = COALESCE($24, payment2_sent_date),
                    payment2_deadline = COALESCE($25, payment2_deadline),
                    total_paid = COALESCE($26, total_paid),
                    payment_status = COALESCE($27, payment_status),
                    updated_at = NOW()
                 WHERE id = $1`,
                [
                    existing[0].id,
                    item.comboCode, item.contract, item.deliveryParcel, item.serialNumber,
                    item.expeditionDate, item.deliveryForecast, item.deliveryDate,
                    item.installationDate, item.trainingDate, item.deliveryStatus,
                    item.equipmentCount, item.nfSent, item.nfNumber, item.nfSentDate,
                    item.provisionalReceiptSent, item.finalReceiptSent, item.nfValue,
                    item.payment1Value, item.payment1Nup, item.payment1SentDate,
                    item.payment2Value, item.payment2Nup, item.payment2SentDate,
                    item.payment2Deadline, item.totalPaid, item.paymentStatus,
                ],
            );
        }
        atualizados++;
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
