import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("cota_geral_municipio")
export class CotaGeralMunicipio {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 7 })
    ibge!: string;

    @Column({ type: "varchar", length: 2 })
    uf!: string;

    @Column({ name: "nome_municipio", type: "varchar" })
    nomeMunicipio!: string;

    @Column({ name: "ente_beneficiario", type: "varchar", default: "Município" })
    enteBeneficiario!: string;

    @Column({ type: "varchar", default: "Geral" })
    finalidade!: string;

    @Column({ type: "integer", default: 0 })
    ambulancia!: number;

    @Column({ type: "integer", default: 0 })
    microonibus!: number;

    @Column({ type: "integer", default: 0 })
    van!: number;
}
