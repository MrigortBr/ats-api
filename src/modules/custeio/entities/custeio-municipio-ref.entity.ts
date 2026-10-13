import { Column, Entity, Index, PrimaryColumn } from "typeorm";

const decimal = {
    to: (v: number | null | undefined) => v,
    from: (v: string | null) => (v === null ? null : Number(v)),
};

/** Base de referência de radioterapia por município (somente leitura): macrorregião, novos casos e km até o acelerador. */
@Entity("custeio_municipio_ref")
export class CusteioMunicipioRef {
    @PrimaryColumn({ name: "codigo_ibge", type: "integer" })
    codigoIbge!: number;

    @Index("idx_custeio_municipio_ref_uf")
    @Column({ type: "char", length: 2 })
    uf!: string;

    @Column({ type: "varchar" })
    municipio!: string;

    @Column({ type: "varchar", default: "" })
    macrorregiao!: string;

    /** 60% dos novos casos de câncer (pacientes de RT sem acompanhantes, antes do arredondamento). */
    @Column({ name: "novos_casos_rt", type: "numeric", precision: 10, scale: 3, default: 0, transformer: decimal })
    novosCasosRt!: number;

    /** Km até o acelerador mais próximo; nulo quando a fonte não informa (ex.: acesso fluvial). */
    @Column({ name: "dist_rt", type: "integer", nullable: true })
    distRt!: number | null;

    /** Pacientes estimados em TRS (hemodiálise), sem acompanhantes. */
    @Column({ name: "pop_trs", type: "numeric", precision: 10, scale: 3, default: 0, transformer: decimal })
    popTrs!: number;

    /** Km até o serviço de TRS mais próximo; nulo = sem rota (ex.: acesso fluvial). */
    @Column({ name: "dist_hd", type: "integer", nullable: true })
    distHd!: number | null;

    /** Município do serviço de TRS mais próximo (sugestão de referência de hemodiálise). */
    @Column({ name: "mun_prox_hd", type: "varchar", nullable: true })
    munProxHd!: string | null;

    /** O próprio município tem TRS habilitado. */
    @Column({ name: "habilitado_trs", type: "boolean", default: false })
    habilitadoTrs!: boolean;

    /** Coordenadas obtidas no Nominatim sob demanda (nulas até a primeira consulta). */
    @Column({ type: "double precision", nullable: true })
    lat!: number | null;

    @Column({ type: "double precision", nullable: true })
    lon!: number | null;

    @Column({ name: "geocodificado_em", type: "timestamptz", nullable: true })
    geocodificadoEm!: Date | null;
}
