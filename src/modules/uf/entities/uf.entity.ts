import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("uf")
export class Uf {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 2, unique: true })
    uf!: string;

    @Column({ type: "varchar" })
    state!: string;

    @Column({ type: "varchar", nullable: true })
    agreement!: string | null;

    @Column({ type: "varchar", nullable: true })
    cib!: string | null;

    @Column({ type: "varchar", nullable: true })
    region!: string | null;
}
