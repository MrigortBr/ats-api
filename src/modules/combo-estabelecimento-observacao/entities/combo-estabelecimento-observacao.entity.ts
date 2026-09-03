import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { ComboEstabelecimentoObservacaoImagem } from "./combo-estabelecimento-observacao-imagem.entity";

@Entity("combo_estabelecimento_observacoes")
export class ComboEstabelecimentoObservacao {
    @PrimaryGeneratedColumn()
    id!: number;

    /** Chave do estabelecimento (ComboConsult.estabKey) — sem FK direta, mesma abordagem do módulo de equipamentos. */
    @Index()
    @Column({ name: "estab_key", type: "varchar" })
    estabKey!: string;

    @Column({ type: "text" })
    texto!: string;

    /** Nome/e-mail de quem registrou a observação — auditoria. */
    @Column({ type: "varchar" })
    autor!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @OneToMany(() => require("./combo-estabelecimento-observacao-imagem.entity").ComboEstabelecimentoObservacaoImagem, (img: ComboEstabelecimentoObservacaoImagem) => img.observacao)
    imagens!: ComboEstabelecimentoObservacaoImagem[];
}
