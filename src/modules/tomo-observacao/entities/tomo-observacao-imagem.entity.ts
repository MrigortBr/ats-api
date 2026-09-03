import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { TomoObservacao } from "./tomo-observacao.entity";

@Entity("tomo_observacao_imagens")
export class TomoObservacaoImagem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ name: "observacao_id", type: "integer" })
    observacaoId!: number;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @ManyToOne(() => require("./tomo-observacao.entity").TomoObservacao, (obs: TomoObservacao) => obs.imagens, { onDelete: "CASCADE" })
    @JoinColumn({ name: "observacao_id" })
    observacao!: TomoObservacao;

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
}
