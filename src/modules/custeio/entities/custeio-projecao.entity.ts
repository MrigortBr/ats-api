import { Column, Entity, PrimaryColumn } from "typeorm";

const decimal = {
    to: (v: number | null | undefined) => v,
    from: (v: string | null) => (v === null ? null : Number(v)),
};
const opts = { type: "numeric", precision: 16, scale: 4, nullable: true, transformer: decimal } as const;

/** Projeção (valores esperados) por macrorregião, importada dos compilados de RT e TRS. Valores como vieram nas planilhas. */
@Entity("custeio_projecao")
export class CusteioProjecao {
    @PrimaryColumn({ type: "char", length: 2 })
    uf!: string;

    @PrimaryColumn({ type: "varchar" })
    macrorregiao!: string;

    @Column({ type: "integer", default: 0 })
    ordem!: number;

    /** Municípios da macrorregião (usado para classificar os atendidos). */
    @Column({ type: "jsonb", default: () => "'[]'" })
    municipios!: string[];

    @Column({ name: "rt_n_acima50", type: "integer", nullable: true }) rtNAcima50!: number | null;
    /** Pacientes de RT a mais de 50 km do acelerador (sem acompanhantes). */
    @Column({ name: "rt_pacientes", ...opts }) rtPacientes!: number | null;
    /** Pacientes + acompanhantes. */
    @Column({ name: "rt_pessoas", ...opts }) rtPessoas!: number | null;
    @Column({ name: "rt_viagens", ...opts }) rtViagens!: number | null;
    @Column({ name: "rt_vans", type: "integer", nullable: true }) rtVans!: number | null;
    @Column({ name: "rt_cap_vans", ...opts }) rtCapVans!: number | null;
    @Column({ name: "rt_micros", type: "integer", nullable: true }) rtMicros!: number | null;
    @Column({ name: "rt_cap_micros", ...opts }) rtCapMicros!: number | null;
    @Column({ name: "rt_saldo", ...opts }) rtSaldo!: number | null;

    @Column({ name: "hd_n_acima50", type: "integer", nullable: true }) hdNAcima50!: number | null;
    @Column({ name: "hd_pacientes", ...opts }) hdPacientes!: number | null;
    /** Pacientes + 10% de acompanhantes. */
    @Column({ name: "hd_pessoas", ...opts }) hdPessoas!: number | null;
    @Column({ name: "hd_viagens", ...opts }) hdViagens!: number | null;
    @Column({ name: "hd_vans", type: "integer", nullable: true }) hdVans!: number | null;
    @Column({ name: "hd_cap_vans", ...opts }) hdCapVans!: number | null;
    @Column({ name: "hd_micros", type: "integer", nullable: true }) hdMicros!: number | null;
    @Column({ name: "hd_cap_micros", ...opts }) hdCapMicros!: number | null;
    @Column({ name: "hd_cap_total", ...opts }) hdCapTotal!: number | null;
    @Column({ name: "hd_saldo", ...opts }) hdSaldo!: number | null;
}
