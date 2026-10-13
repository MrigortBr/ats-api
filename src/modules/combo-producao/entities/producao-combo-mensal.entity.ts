import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/** [frequência (nº de AIH), valor (R$)] de uma competência. */
export type ProducaoMes = [number, number];

/**
 * Produção hospitalar (SIA/SIH) por estabelecimento do combo, um registro por CNES + (sub)grupo de procedimentos.
 * `meses` é um JSON { "AAAAMM": [frequencia, valor] } — evita uma linha por mês.
 */
@Entity("producao_combo_mensal")
export class ProducaoComboMensal {
    @PrimaryColumn({ type: "varchar", length: 7 })
    cnes!: string;

    /** Grupo/subgrupo de procedimentos SIGTAP (ex.: "0405" = cirurgias oftalmológicas). */
    @PrimaryColumn({ type: "varchar", length: 4 })
    grupo!: string;

    @Column({ type: "jsonb", default: () => "'{}'" })
    meses!: Record<string, ProducaoMes>;

    @UpdateDateColumn({ name: "atualizado_em" })
    atualizadoEm!: Date;
}
