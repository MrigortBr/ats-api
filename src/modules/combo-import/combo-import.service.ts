import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
    CAMPOS, Coluna, ItemPlano, LinhaBanco, Plano, ResumoCampo, Resumo,
    planejar, resumir, resumirPorCampo,
} from "./combo-import.plan";

const LIMITE_AMOSTRA = 200;

/** Prefixo do Nº do combo -> nome da empresa em "companies". */
const EMPRESA_POR_PREFIXO: Record<string, string> = {
    ADV: "ADVANCED INDUSTRIA",
    BLI: "BL INDUSTRIA",
    HOS: "HOSPCOM",
    IMX: "IMX INDUSTRIA",
    KSS: "KSS COMERCIO",
    OFT: "OFTALMOSERV COMERCIO",
    WMJ: "W M JR - COMERCIO",
};

export interface PreviewResultado {
    resumo: Resumo;
    porCampo: ResumoCampo[];
    amostra: ItemPlano[];
    amostraTruncada: boolean;
    travadas: ItemPlano[];
    duplicadas: ItemPlano[];
    excluidasNoSistema: ItemPlano[];
    invalidas: ItemPlano[];
    avisos: { linha: number | null; chave: string | null; avisos: string[] }[];
}

export interface ApplyResultado {
    criadas: number;
    atualizadas: number;
    camposPreenchidos: number;
    camposSubstituidos: number;
    puladasPorTravaDuranteGravacao: number;
}

const COLUNAS_SQL = CAMPOS.map((c) => c.coluna);

@Injectable()
export class ComboImportService {
    constructor(private readonly dataSource: DataSource) {}

    private async carregarBanco(m: EntityManager): Promise<LinhaBanco[]> {
        const cols = COLUNAS_SQL.map((c) => `"${c}"`).join(", ");
        const rows: Record<string, unknown>[] = await m.query(
            `SELECT id, equip_key, locked_by, deleted_at, ${cols} FROM combo_consult`,
        );
        return rows.map((r) => ({
            id: Number(r.id),
            equipKey: (r.equip_key as string | null) ?? null,
            lockedBy: (r.locked_by as string | null) ?? null,
            deletedAt: (r.deleted_at as Date | null) ?? null,
            valores: Object.fromEntries(COLUNAS_SQL.map((c) => [c, r[c]])),
        }));
    }

    private validar(rows: Record<string, unknown>[]): void {
        if (!rows.length) throw new BadRequestException("Planilha sem linhas");
    }

    async preview(rows: Record<string, unknown>[]): Promise<PreviewResultado> {
        this.validar(rows);
        const banco = await this.carregarBanco(this.dataSource.manager);
        const plano = planejar(banco, rows);
        const mexe = plano.itens.filter((i) => i.acao === "criar" || i.acao === "atualizar");
        const por = (a: ItemPlano["acao"]) => plano.itens.filter((i) => i.acao === a);
        return {
            resumo: resumir(plano),
            porCampo: resumirPorCampo(plano),
            amostra: mexe.slice(0, LIMITE_AMOSTRA),
            amostraTruncada: mexe.length > LIMITE_AMOSTRA,
            travadas: por("travada"),
            duplicadas: por("duplicada"),
            excluidasNoSistema: por("excluida_no_sistema"),
            invalidas: por("invalida"),
            avisos: plano.itens
                .filter((i) => i.avisos.length)
                .map((i) => ({ linha: i.linha, chave: i.chave, avisos: i.avisos })),
        };
    }

    async apply(rows: Record<string, unknown>[]): Promise<ApplyResultado> {
        this.validar(rows);
        return this.dataSource.transaction(async (m) => {
            // Recalcula no servidor dentro da transação: não confia no preview do cliente.
            const banco = await this.carregarBanco(m);
            const plano: Plano = planejar(banco, rows);
            const empresas = await this.empresasPorPrefixo(m);
            const out: ApplyResultado = {
                criadas: 0, atualizadas: 0, camposPreenchidos: 0, camposSubstituidos: 0,
                puladasPorTravaDuranteGravacao: 0,
            };

            for (const it of plano.itens) {
                if (it.acao === "criar" && it.novo) {
                    const { equipKey, estabKey, valores } = it.novo;
                    const colunas = Object.keys(valores) as Coluna[];
                    const prefixo = String(valores.combo_code ?? "").slice(0, 3).toUpperCase();
                    const companyId = empresas.get(prefixo) ?? null;
                    const nomes = ["equip_key", "estab_key", ...colunas, "company_id"];
                    const params = [equipKey, estabKey, ...colunas.map((c) => valores[c]), companyId];
                    await m.query(
                        `INSERT INTO combo_consult (${nomes.map((n) => `"${n}"`).join(", ")}, created_at, updated_at)
                         VALUES (${params.map((_, i) => `$${i + 1}`).join(", ")}, now(), now())`,
                        params,
                    );
                    out.criadas++;
                } else if (it.acao === "atualizar" && it.id !== undefined) {
                    const sets = it.mudancas.map((c, i) => `"${c.coluna}" = $${i + 1}`);
                    const params: unknown[] = it.mudancas.map((c) => c.para);
                    params.push(it.id);
                    const res: unknown = await m.query(
                        `UPDATE combo_consult SET ${sets.join(", ")}, updated_at = now()
                          WHERE id = $${params.length} AND locked_by IS NULL AND deleted_at IS NULL
                      RETURNING id`,
                        params,
                    );
                    // postgres driver: UPDATE ... RETURNING => [rows, count]
                    const linhas = Array.isArray(res) && Array.isArray(res[0]) ? (res[0] as unknown[]).length : 0;
                    if (linhas === 0) { out.puladasPorTravaDuranteGravacao++; continue; }
                    out.atualizadas++;
                    for (const c of it.mudancas) {
                        if (c.tipo === "preencher") out.camposPreenchidos++;
                        else out.camposSubstituidos++;
                    }
                }
            }
            return out;
        });
    }

    private async empresasPorPrefixo(m: EntityManager): Promise<Map<string, number>> {
        const rows: { id: number; name: string }[] = await m.query(`SELECT id, name FROM companies WHERE deleted_at IS NULL`);
        const porNome = new Map(rows.map((r) => [r.name.trim().toUpperCase(), Number(r.id)]));
        const mapa = new Map<string, number>();
        for (const [prefixo, nome] of Object.entries(EMPRESA_POR_PREFIXO)) {
            const id = porNome.get(nome);
            if (id !== undefined) mapa.set(prefixo, id);
        }
        return mapa;
    }
}
