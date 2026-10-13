import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm";
import { CusteioResponsavel } from "./custeio-responsavel.entity";

const decimal = {
    to: (v: number | null | undefined) => v,
    from: (v: string | null) => (v === null ? null : Number(v)),
};

@Entity("custeio_atendido")
export class CusteioAtendido {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "responsavel_id", type: "integer" })
    responsavelId!: number;

    @ManyToOne(() => CusteioResponsavel, (r) => r.atendidos, { onDelete: "CASCADE" })
    @JoinColumn({ name: "responsavel_id" })
    responsavel!: Relation<CusteioResponsavel>;

    @Column({ type: "integer", default: 0 })
    ordem!: number;

    @Column({ type: "varchar" })
    nome!: string;

    /** Sufixo do documento: "entorno" / "distritos". */
    @Column({ type: "varchar", nullable: true })
    tag!: string | null;

    /** Pacientes de radioterapia sem acompanhantes (aceita meio paciente). */
    @Column({ type: "numeric", precision: 9, scale: 1, default: 0, transformer: decimal })
    rt!: number;

    @Column({ type: "integer", default: 0 })
    hd!: number;

    /** Distância em km; nula quando a fonte informa só a faixa. */
    @Column({ name: "dist_rt", type: "numeric", precision: 9, scale: 2, nullable: true, transformer: decimal })
    distRt!: number | null;

    @Column({ name: "dist_hd", type: "numeric", precision: 9, scale: 2, nullable: true, transformer: decimal })
    distHd!: number | null;

    /** Rótulo da faixa (igual ao de premissas.ts); usado quando não há km. */
    @Column({ name: "faixa_rt", type: "varchar", nullable: true })
    faixaRt!: string | null;

    @Column({ name: "faixa_hd", type: "varchar", nullable: true })
    faixaHd!: string | null;

    /** UF da cidade de referência quando o deslocamento é interestadual; nulo = mesma UF do custeio. */
    @Column({ name: "ref_uf", type: "char", length: 2, nullable: true })
    refUf!: string | null;
}
