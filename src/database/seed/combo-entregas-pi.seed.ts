import { DataSource } from "typeorm";
import { DB_BASE_OPTIONS } from "../db.config";
import entregas from "./combo-entregas-pi.data.json";

/**
 * Ajusta exclusivamente as datas de entrega do PI informadas na planilha.
 *
 * A chave é CNES + tipo de combo. Assim, quando um estabelecimento tiver
 * Cirurgia e Oftalmo, cada data permanece vinculada ao combo correto.
 * Não altera situação, produção ou qualquer outro campo.
 *
 * Uso: npm run seed:combo-entregas-pi
 */

type EntregaDoPi = {
    cnes: string;
    comboType: string;
    deliveryDate: string;
    sourceRow: number;
};

const dados = entregas as EntregaDoPi[];

const ds = new DataSource({
    ...DB_BASE_OPTIONS,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false,
    synchronize: false,
    migrations: [],
});

async function main() {
    await ds.initialize();

    const resultado = {
        fonte: "Datas de entrega do PI informadas na planilha",
        linhasDaFonte: dados.length,
        registrosAtualizados: 0,
        chavesNaoEncontradas: [] as Array<Pick<EntregaDoPi, "cnes" | "comboType" | "sourceRow">>,
    };

    for (const item of dados) {
        const atualizados: Array<{ id: number }> = await ds.query(
            `UPDATE combo_consult
             SET delivery_date = $3, updated_at = NOW()
             WHERE cnes = $1
               AND combo_type = $2
               AND uf = 'PI'
               AND deleted_at IS NULL
             RETURNING id`,
            [item.cnes, item.comboType, item.deliveryDate],
        );

        if (atualizados.length === 0) {
            resultado.chavesNaoEncontradas.push({
                cnes: item.cnes,
                comboType: item.comboType,
                sourceRow: item.sourceRow,
            });
        } else {
            resultado.registrosAtualizados += atualizados.length;
        }
    }

    await ds.destroy();
    console.log(JSON.stringify({
        ...resultado,
        combinacoesNaoEncontradas: resultado.chavesNaoEncontradas.length,
    }, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
