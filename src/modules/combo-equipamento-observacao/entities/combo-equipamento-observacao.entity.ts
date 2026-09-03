import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { ComboEquipamentoObservacaoImagem } from "./combo-equipamento-observacao-imagem.entity";

@Entity("combo_equipamento_observacoes")
export class ComboEquipamentoObservacao {
    @PrimaryGeneratedColumn()
    id!: number;

    /** Chave única do equipamento (ComboConsult.equipKey) — sem FK direta, mesma abordagem do módulo de aceleradores. */
    @Index()
    @Column({ name: "equip_key", type: "varchar" })
    equipKey!: string;

    @Column({ type: "text" })
    texto!: string;

    /** Nome/e-mail de quem registrou a observação — auditoria. */
    @Column({ type: "varchar" })
    autor!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @OneToMany(() => require("./combo-equipamento-observacao-imagem.entity").ComboEquipamentoObservacaoImagem, (img: ComboEquipamentoObservacaoImagem) => img.observacao)
    imagens!: ComboEquipamentoObservacaoImagem[];
}
