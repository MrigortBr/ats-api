import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { RnmObservacaoImagem } from "./rnm-observacao-imagem.entity";

@Entity("rnm_observacoes")
export class RnmObservacao {
    @PrimaryGeneratedColumn()
    id!: number;

    /** hospital_id — mesmo id usado por hospital_rnm/hospital_id, sem FK direta (mesma abordagem dos outros módulos de observação). */
    @Index()
    @Column({ name: "hospital_id", type: "integer" })
    hospitalId!: number;

    @Column({ type: "text" })
    texto!: string;

    /** Nome/e-mail de quem registrou a observação — auditoria. */
    @Column({ type: "varchar" })
    autor!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @OneToMany(() => require("./rnm-observacao-imagem.entity").RnmObservacaoImagem, (img: RnmObservacaoImagem) => img.observacao)
    imagens!: RnmObservacaoImagem[];
}
