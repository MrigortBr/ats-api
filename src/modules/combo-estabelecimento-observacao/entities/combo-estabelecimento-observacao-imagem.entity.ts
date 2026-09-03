import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { ComboEstabelecimentoObservacao } from "./combo-estabelecimento-observacao.entity";

@Entity("combo_estabelecimento_observacao_imagens")
export class ComboEstabelecimentoObservacaoImagem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ name: "observacao_id", type: "integer" })
    observacaoId!: number;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @ManyToOne(() => require("./combo-estabelecimento-observacao.entity").ComboEstabelecimentoObservacao, (obs: ComboEstabelecimentoObservacao) => obs.imagens, { onDelete: "CASCADE" })
    @JoinColumn({ name: "observacao_id" })
    observacao!: ComboEstabelecimentoObservacao;

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
