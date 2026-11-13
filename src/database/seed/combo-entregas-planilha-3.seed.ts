import { DataSource } from "typeorm";
import { DB_BASE_OPTIONS } from "../db.config";
import entregas from "./combo-entregas-planilha-3.data.json";

/**
 * Seed independente das datas de entrega da planilha
 * "Planilha de Controle de entrega Pac Cirurgia_automatizada (3).xlsx".
 *
 * A lista foi gerada exclusivamente da aba "Controle_por_equipamento":
 * 1.760 chaves, inclusive linhas sem data (que limpam delivery_date).
 * Não lê outra planilha e não compara valores atuais antes de sobrescrever.
 *
 * Uso: npm run seed:combo-entregas-planilha-3
 */

type EntregaDaPlanilha = {
    equipKey: string;
    deliveryDate: string | null;
    sourceRow: number;
};

const dados = entregas as EntregaDaPlanilha[];

const ds = new DataSource({
    ...DB_BASE_OPTIONS,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false,
    synchronize: false,
    migrations: [],
});

async function main() {
    await ds.initialize();

    let atualizados = 0;
    const naoEncontrados: string[] = [];
    const tamanhoDoLote = 50;

    for (let inicio = 0; inicio < dados.length; inicio += tamanhoDoLote) {
        const lote = dados.slice(inicio, inicio + tamanhoDoLote);
        const resultados = await Promise.all(lote.map(async item => {
            const registros: Array<{ equip_key: string }> = await ds.query(
                `UPDATE combo_consult
                 SET delivery_date = $2, updated_at = NOW()
                 WHERE equip_key = $1 AND deleted_at IS NULL
                 RETURNING equip_key`,
                [item.equipKey, item.deliveryDate],
            );
            return { item, encontrado: registros.length > 0 };
        }));

        for (const resultado of resultados) {
            if (resultado.encontrado) atualizados++;
            else naoEncontrados.push(resultado.item.equipKey);
        }
    }

    await ds.destroy();
    console.log(JSON.stringify({
        fonte: "Planilha de Controle de entrega Pac Cirurgia_automatizada (3).xlsx / Controle_por_equipamento",
        linhasDaFonte: dados.length,
        atualizados,
        naoEncontrados: naoEncontrados.length,
        chavesNaoEncontradas: naoEncontrados,
    }, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
