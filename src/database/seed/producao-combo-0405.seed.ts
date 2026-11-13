import { DataSource } from "typeorm";
import { DB_BASE_OPTIONS } from "../db.config";
import * as fs from "fs";
import * as path from "path";

/**
 * Carrega a produção mensal (SIH) dos estabelecimentos com algum combo (qualquer combo_type em combo_consult)
 * em producao_combo_mensal, em dois grupos:
 *   - "04"   : demais procedimentos do grupo 04 (subgrupos 0401–0416 somados, SEM o 0405) -> producao-combo-04.data.json
 *              usado na tela Combo (estabelecimento);
 *   - "0405" : subgrupo 0405 (cirurgias oftalmológicas)                        -> producao-combo-0405.data.json
 *              usado na tela Combo Equipamento (equipamentos de oftalmo).
 * Fonte: producao_AIH_primario_grupo04_2025_2026_parte1..4.xlsx, somados por CNES e competência
 * (frequência = nº de AIH, valor = R$).
 *
 * - Só entra CNES que existe em combo_consult, de qualquer tipo de combo (os demais são ignorados e listados).
 * - Valida nome do município e UF do arquivo contra o cadastro do estabelecimento (divergência só avisa).
 * - Idempotente e autoritativo: a carga substitui integralmente os meses do grupo/CNES.
 *   Assim, uma atualização de planilha também remove competências que não existam mais na fonte.
 *
 * Uso: npm run seed:producao-combo-0405            (grava)
 *      npm run seed:producao-combo-0405 -- --dry   (só confere, não grava)
 *      npm run seed:producao-combo-0405 -- --grupo=04   (só o grupo 04; também aceita --dry)
 */
const GRUPOS: { grupo: string; arquivo: string }[] = [
    { grupo: "04", arquivo: "producao-combo-04.data.json" },
    { grupo: "0405", arquivo: "producao-combo-0405.data.json" },
];

interface Registro {
    cnes: string;
    nome: string;
    uf: string;
    municipio: string;
    meses: Record<string, [number, number]>;
}

const ds = new DataSource({
    ...DB_BASE_OPTIONS,
    ssl: process.env.DB_SSL !== "false" ? { rejectUnauthorized: false } : false,
    synchronize: false,
    migrations: [],
});

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

async function main(): Promise<void> {
    const dry = process.argv.includes("--dry");

    await ds.initialize();
    console.log(`Conectado.${dry ? " (modo --dry: nada será gravado)" : ""}`);

    // hospital_combo foi substituída por combo_consult (migration 36): uma linha por equipamento, com o CNES e o tipo do combo.
    const combos: { cnes: string; nome: string; municipio: string; uf: string }[] = await ds.query(`
        SELECT DISTINCT cnes, establishment_name AS nome, municipality AS municipio, uf
        FROM combo_consult
        WHERE deleted_at IS NULL AND cnes IS NOT NULL
    `);
    const porCnes = new Map(combos.map(c => [c.cnes.padStart(7, "0"), c]));

    // --grupo=04 (ou 0405) grava só esse grupo; sem a flag, grava os dois.
    const filtro = process.argv.find(a => a.startsWith("--grupo="))?.split("=")[1];
    const selecionados = filtro ? GRUPOS.filter(g => g.grupo === filtro) : GRUPOS;
    if (filtro && selecionados.length === 0) throw new Error(`Grupo desconhecido: ${filtro} (use 04 ou 0405)`);

    for (const { grupo, arquivo } of selecionados) {
        const registros: Registro[] = JSON.parse(fs.readFileSync(path.join(__dirname, arquivo), "utf-8"));

        let gravados = 0;
        const semCombo: string[] = [];
        const divergentes: string[] = [];
        const competencias = new Set<string>();

        for (const r of registros) {
            const cnes = r.cnes.padStart(7, "0");
            const est = porCnes.get(cnes);
            if (!est) { semCombo.push(`${cnes} ${r.nome} (${r.uf})`); continue; }
            if (norm(est.uf) !== norm(r.uf) || norm(est.municipio) !== norm(r.municipio)) {
                divergentes.push(`${cnes}: cadastro ${est.municipio}/${est.uf} × arquivo ${r.municipio}/${r.uf}`);
            }
            for (const m of Object.keys(r.meses)) competencias.add(m);
            if (!dry) {
                await ds.query(
                    `INSERT INTO producao_combo_mensal (cnes, grupo, meses)
                     VALUES ($1, $2, $3::jsonb)
                     ON CONFLICT (cnes, grupo) DO UPDATE
                     SET meses = EXCLUDED.meses, atualizado_em = now()`,
                    [cnes, grupo, JSON.stringify(r.meses)],
                );
            }
            gravados++;
        }

        console.log(`\n=== Grupo ${grupo} ===`);
        console.log(`Arquivo: ${registros.length} CNES · competências ${[...competencias].sort().join(", ")}`);
        console.log(`${dry ? "Seriam gravados" : "Gravados"}: ${gravados}`);
        console.log(`Estabelecimentos com combo sem produção no arquivo: ${porCnes.size - gravados} de ${porCnes.size} estabelecimentos`);
        if (semCombo.length) console.log(`Ignorados (CNES sem combo cadastrado): ${semCombo.length}\n  ${semCombo.join("\n  ")}`);
        if (divergentes.length) console.log(`Divergências de município/UF: ${divergentes.length}\n  ${divergentes.join("\n  ")}`);
    }

    await ds.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
