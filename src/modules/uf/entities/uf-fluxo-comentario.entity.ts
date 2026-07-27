import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Uf } from "./uf.entity";

@Entity("uf_fluxo_comentarios")
export class UfFluxoComentario {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "uf_id", type: "integer" })
    ufId!: number;

    @ManyToOne(() => Uf, { onDelete: "CASCADE" })
    @JoinColumn({ name: "uf_id" })
    uf!: Uf;

    @Column({ type: "text" })
    texto!: string;

    @Column({ type: "varchar", nullable: true, default: null })
    url!: string | null;

    @Column({ type: "varchar" })
    autor!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
