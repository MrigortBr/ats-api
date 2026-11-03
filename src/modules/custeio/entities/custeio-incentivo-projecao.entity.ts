import { Column, Entity, PrimaryColumn } from "typeorm";

const decimal = {
    to: (v: number | null | undefined) => v,
    from: (v: string | null) => (v === null ? null : Number(v)),
};

/** Totais de incentivo por UF, transcritos das abas COMPILADO das planilhas oficiais. */
@Entity("custeio_incentivo_projecao")
export class CusteioIncentivoProjecao {
    @PrimaryColumn({ type: "char", length: 2 })
    uf!: string;

    /** RTx: planejamento + tratamento conforme o compilado da UF. */
    @Column({ name: "rt_incentivo", type: "numeric", precision: 16, scale: 2, nullable: true, transformer: decimal })
    rtIncentivo!: number | null;

    /** TRS: incentivo anual conforme o compilado da UF. */
    @Column({ name: "hd_incentivo_anual", type: "numeric", precision: 16, scale: 2, nullable: true, transformer: decimal })
    hdIncentivoAnual!: number | null;

    @Column({ type: "varchar", default: "Abas COMPILADO por UF" })
    fonte!: string;
}
