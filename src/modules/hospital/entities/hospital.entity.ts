import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Uf } from "../../uf/entities/uf.entity";
import type { HospitalTomo } from "./hospital-tomo.entity";
import type { HospitalRnm } from "./hospital-rnm.entity";

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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @OneToOne(() => require("./hospital-tomo.entity").HospitalTomo, (t: HospitalTomo) => t.hospital)
    tomo!: HospitalTomo | null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @OneToOne(() => require("./hospital-rnm.entity").HospitalRnm, (r: HospitalRnm) => r.hospital)
    rnm!: HospitalRnm | null;

}
