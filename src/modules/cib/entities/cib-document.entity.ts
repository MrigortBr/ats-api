import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Uf } from "../../uf/entities/uf.entity";

@Entity("cib_document")
export class CibDocument {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "uf_id", type: "integer" })
    ufId!: number;

    @ManyToOne(() => Uf)
    @JoinColumn({ name: "uf_id" })
    uf!: Uf;

    @Column({ type: "varchar" })
    filename!: string;

    @Column({ type: "varchar" })
    mimetype!: string;

    @Column({ type: "integer" })
    size!: number;

    @Column({ type: "bytea" })
    data!: Buffer;

    @Column({ name: "uploaded_by", type: "varchar" })
    uploadedBy!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt!: Date | null;
}
