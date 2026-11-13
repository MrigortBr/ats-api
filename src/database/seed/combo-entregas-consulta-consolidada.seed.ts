import { DataSource } from "typeorm";
import { DB_BASE_OPTIONS } from "../db.config";
import entregas from "./combo-entregas-consulta-consolidada.data.json";

/**
 * Sincroniza a data de entrega a partir da aba Consulta_Consolidada da planilha
 * "Planilha de Controle de entrega Pac Cirurgia_automatizada (3).xlsx".
 *
 * A fonte é a coluna "Data de Entrega Concretizada ao Destinatário". O PI fica
 * deliberadamente fora deste snapshot, pois suas datas são tratadas em seed próprio.
 * Datas são gravadas no formato dd/mm/aaaa; campos vazios limpam delivery_date.
 *
 * Uso: npm run seed:combo-entregas-consulta-consolidada
 */

type EntregaConsultaConsolidada = {
    equipKey: string;
    uf: string;
    cnes: string;
    deliveryDate: string | null;
    sourceRow: number;
};

const dados = entregas as EntregaConsultaConsolidada[];

const ds = new DataSource({
    ...DB_BASE_OPTIONS,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false,
    synchronize: false,
    migrations: [],
});

async function main() {
    await ds.initialize();

    let atualizados = 0;
    const chavesNaoEncontradas: EntregaConsultaConsolidada[] = [];
    const tamanhoDoLote = 50;

    for (let inicio = 0; inicio < dados.length; inicio += tamanhoDoLote) {
        const lote = dados.slice(inicio, inicio + tamanhoDoLote);
        const resultados = await Promise.all(lote.map(async item => {
            const registros: Array<{ equip_key: string }> = await ds.query(
                `UPDATE combo_consult
                 SET delivery_date = $4, updated_at = NOW()
                 WHERE equip_key = $1
                   AND uf = $2
                   AND cnes = $3
                   AND uf <> 'PI'
                   AND deleted_at IS NULL
                 RETURNING equip_key`,
                [item.equipKey, item.uf, item.cnes, item.deliveryDate],
            );
            return { item, encontrado: registros.length > 0, atualizados: registros.length };
        }));

        for (const resultado of resultados) {
            if (resultado.encontrado) atualizados += resultado.atualizados;
            else chavesNaoEncontradas.push(resultado.item);
        }
    }

    await ds.destroy();
    console.log(JSON.stringify({
        fonte: "Consulta_Consolidada / Data de Entrega Concretizada ao Destinatário",
        ufsIgnoradas: ["PI"],
        linhasDaFonte: dados.length,
        atualizados,
        naoEncontrados: chavesNaoEncontradas.length,
        chavesNaoEncontradas,
    }, null, 2));
}

main().catch(error => { console.error(error); process.exit(1); });
