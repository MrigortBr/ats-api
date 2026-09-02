import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("cib_municipio")
export class CibMunicipio {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 7, nullable: true })
    ibge!: string | null;

    @Column({ type: "varchar", length: 2 })
    uf!: string;

    @Column({ name: "nome_municipio", type: "varchar" })
    nomeMunicipio!: string;

    @Column({ name: "regiao_saude", type: "varchar", nullable: true })
    regiaoSaude!: string | null;

    @Column({ type: "boolean", default: false })
    radioterapia!: boolean;

    @Column({ name: "trs_hemodialise", type: "boolean", default: false })
    trsHemodialise!: boolean;

    @Column({ type: "varchar", nullable: true })
    veiculos!: string | null;

    @Column({ name: "resolucao_ref", type: "varchar", nullable: true })
    resolucaoRef!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}
