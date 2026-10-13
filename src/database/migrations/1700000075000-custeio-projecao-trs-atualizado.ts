import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Atualiza a projeção de TRS conforme o compilado final (COMPILADO TRS ATUALIZADO EM 15-04 - VERSÃO FINAL).
 * - AM: viagens/ano recalculadas com 312 viagens/pessoa (antes ~28,4) e saldo refeito.
 * - BA: preenche o saldo (a planilha anterior não tinha).
 * - RO: nº de vans/capacidade atualizados.
 * PR e RS já estavam iguais ao compilado e não mudam.
 * Campos: [viagens, vans, cap. vans, cap. total, saldo]; null = não altera.
 */
type Campos = { viagens?: number; vans?: number; capVans?: number; capTotal?: number; saldo: number | null };
interface Ajuste { uf: string; macro: string; novo: Campos; antigo: Campos }

const AJUSTES: Ajuste[] = [
    { uf: "AM", macro: "OESTE", novo: { viagens: 3775.2, saldo: 33664.8 }, antigo: { viagens: 343.20000000000005, saldo: 37096.8 } },
    { uf: "AM", macro: "LESTE", novo: { viagens: 65208, saldo: 17160 }, antigo: { viagens: 5928, saldo: 76440 } },
    { uf: "AM", macro: "CENTRAL", novo: { viagens: 94723.20000000001, saldo: -2995.2000000000116 }, antigo: { viagens: 8611.2, saldo: 83116.8 } },
    { uf: "BA", macro: "SUL (NBS - ILHEUS)", novo: { saldo: -8205.599999999977 }, antigo: { saldo: null } },
    { uf: "BA", macro: "SUDOESTE (NBS - VITORIA CONQUISTA)", novo: { saldo: 7488 }, antigo: { saldo: null } },
    { uf: "BA", macro: "OESTE (NBS - BARREIRAS)", novo: { saldo: -8580 }, antigo: { saldo: null } },
    { uf: "BA", macro: "NORTE - (NRS - JUAZEIRO)", novo: { saldo: 2152.7999999999884 }, antigo: { saldo: null } },
    { uf: "BA", macro: "NORDESTE (NRS - ALAGOINHAS)", novo: { saldo: 2152.7999999999884 }, antigo: { saldo: null } },
    { uf: "BA", macro: "LESTE - (NRS - SALVADOR)", novo: { saldo: -2652 }, antigo: { saldo: null } },
    { uf: "BA", macro: "EXTREMO SUL (NRS - TEIXEIRA FREITAS)", novo: { saldo: -1310.3999999999942 }, antigo: { saldo: null } },
    { uf: "BA", macro: "CENTRO-LESTE (NRS - FEIRA SANTANA)", novo: { saldo: 5272.799999999988 }, antigo: { saldo: null } },
    { uf: "BA", macro: "CENTRO - NORTE (NRS - JACOBINA)", novo: { saldo: -7612.799999999988 }, antigo: { saldo: null } },
    { uf: "RO", macro: "MACRORREGIONAL II (CACOAL)", novo: { vans: 4, capVans: 37440, capTotal: 109824, saldo: 20935.20000000001 }, antigo: { vans: 3, capVans: 28080, capTotal: 100464, saldo: 11575.200000000012 } },
    { uf: "RO", macro: "MACRORREGIAO I - PORTO VELHO", novo: { vans: 2, capVans: 18720, capTotal: 91104, saldo: 19718.399999999994 }, antigo: { vans: 3, capVans: 28080, capTotal: 100464, saldo: 29078.399999999994 } },
];

async function aplicar(queryRunner: QueryRunner, uf: string, macro: string, c: Campos): Promise<void> {
    const sets: string[] = [];
    const params: (string | number | null)[] = [uf, macro];
    const add = (coluna: string, valor: number | null | undefined) => {
        if (valor === undefined) return;
        params.push(valor);
        sets.push(`"${coluna}" = $${params.length}`);
    };
    add("hd_viagens", c.viagens);
    add("hd_vans", c.vans);
    add("hd_cap_vans", c.capVans);
    add("hd_cap_total", c.capTotal);
    add("hd_saldo", c.saldo);
    await queryRunner.query(`UPDATE "custeio_projecao" SET ${sets.join(", ")} WHERE "uf" = $1 AND "macrorregiao" = $2`, params);
}

export class CusteioProjecaoTrsAtualizado1700000075000 implements MigrationInterface {
    name = "CusteioProjecaoTrsAtualizado1700000075000";

    async up(queryRunner: QueryRunner): Promise<void> {
        for (const a of AJUSTES) await aplicar(queryRunner, a.uf, a.macro, a.novo);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        for (const a of AJUSTES) await aplicar(queryRunner, a.uf, a.macro, a.antigo);
    }
}
