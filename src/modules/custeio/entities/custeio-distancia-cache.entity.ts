import { Column, Entity, PrimaryColumn } from "typeorm";

/** Distância por estrada já calculada entre dois municípios (km). */
@Entity("custeio_distancia_cache")
export class CusteioDistanciaCache {
    @PrimaryColumn({ name: "origem_ibge", type: "integer" })
    origemIbge!: number;

    @PrimaryColumn({ name: "destino_ibge", type: "integer" })
    destinoIbge!: number;

    @Column({
        type: "numeric", precision: 9, scale: 2,
        transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
    })
    km!: number;

    @Column({ name: "calculado_em", type: "timestamptz", default: () => "now()" })
    calculadoEm!: Date;
}
