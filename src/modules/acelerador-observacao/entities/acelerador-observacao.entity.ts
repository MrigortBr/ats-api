import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("acelerador_observacoes")
export class AceleradorObservacao {
    @PrimaryGeneratedColumn()
    id!: number;

    /** CNES do estabelecimento (linha da Tabelona_Aceleradores.xlsx) — sem FK, pois a origem é a planilha, não uma tabela. */
    @Index()
    @Column({ name: "cnes", type: "varchar" })
    cnes!: string;

    @Column({ type: "text" })
    texto!: string;

    /** Nome/e-mail de quem registrou a observação — auditoria. */
    @Column({ type: "varchar" })
    autor!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
