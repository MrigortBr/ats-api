import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

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
}
