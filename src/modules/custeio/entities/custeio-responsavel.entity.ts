import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from "typeorm";
import { CusteioAtendido } from "./custeio-atendido.entity";

@Entity("custeio_responsavel")
export class CusteioResponsavel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 2 })
    uf!: string;

    @Column({ type: "integer", default: 0 })
    ordem!: number;

    @Column({ type: "varchar" })
    macrorregiao!: string;

    @Column({ type: "varchar" })
    municipio!: string;

    /** Só preenchido quando o gestor de hemodiálise é outro município (exceção). */
    @Column({ name: "gestor_hd", type: "varchar", nullable: true })
    gestorHd!: string | null;

    @Column({ name: "tipo_veiculo", type: "varchar", nullable: true })
    tipoVeiculo!: string | null;

    /** Tipo do veículo de hemodiálise quando difere do de radioterapia. */
    @Column({ name: "tipo_veiculo_hd", type: "varchar", nullable: true })
    tipoVeiculoHd!: string | null;

    @Column({ name: "n_veiculos", type: "integer", nullable: true })
    nVeiculos!: number | null;

    @Column({ name: "ref_rt", type: "varchar", nullable: true })
    refRt!: string | null;

    @Column({ name: "ref_hd", type: "varchar", nullable: true })
    refHd!: string | null;

    /** Município atendido por mais de um responsável: custo dividido em N partes. */
    @Column({ name: "divisao_n", type: "integer", nullable: true })
    divisaoN!: number | null;

    @Column({ name: "divisao_indice", type: "integer", nullable: true })
    divisaoIndice!: number | null;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt!: Date | null;

    @OneToMany(() => CusteioAtendido, (a) => a.responsavel)
    atendidos!: Relation<CusteioAtendido>[];
}
