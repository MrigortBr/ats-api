import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Uf } from "../../uf/entities/uf.entity";
import { HospitalTomo } from "./hospital-tomo.entity";
import { HospitalRnm } from "./hospital-rnm.entity";
import { HospitalCombo } from "./hospital-combo.entity";

@Entity("hospital")
export class Hospital {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "uf_id", type: "integer" })
    ufId!: number;

    @ManyToOne(() => Uf)
    @JoinColumn({ name: "uf_id" })
    uf!: Uf;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar" })
    municipality!: string;

    @Column({ type: "varchar", length: 7, nullable: true })
    cnes!: string | null;

    @Column({ type: "varchar", nullable: true })
    cnpj!: string | null;

    @Column({ name: "ibge_code", type: "varchar", length: 7, nullable: true })
    ibgeCode!: string | null;

    @Column({ type: "varchar", nullable: true })
    gestao!: string | null;

    @Column({ name: "natureza_juridica", type: "varchar", nullable: true })
    naturezaJuridica!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @OneToOne(() => HospitalTomo, (t) => t.hospital)
    tomo!: HospitalTomo | null;

    @OneToOne(() => HospitalRnm, (r) => r.hospital)
    rnm!: HospitalRnm | null;

    @OneToMany(() => HospitalCombo, (c) => c.hospital)
    combos!: HospitalCombo[];
}
