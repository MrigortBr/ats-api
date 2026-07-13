import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { HospitalCombo } from "./hospital-combo.entity";

@Entity("combo_equipamento")
export class ComboEquipamento {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "combo_id", type: "integer" })
    comboId!: number;

    @ManyToOne(() => HospitalCombo, (c) => c.equipamentos, { onDelete: "CASCADE" })
    @JoinColumn({ name: "combo_id" })
    combo!: HospitalCombo;

    // Equipamento

    @Column({ name: "combo_code", type: "varchar", nullable: true })
    comboCode!: string | null;

    @Column({ name: "equipment_name", type: "varchar" })
    equipmentName!: string;

    @Column({ name: "serial_number", type: "varchar", nullable: true })
    serialNumber!: string | null;

    // Nota Fiscal

    @Column({ name: "nf_sent", type: "boolean", nullable: true })
    nfSent!: boolean | null;

    @Column({ name: "nf_number", type: "varchar", nullable: true })
    nfNumber!: string | null;

    @Column({ name: "nf_sent_date", type: "varchar", nullable: true })
    nfSentDate!: string | null;

    @Column({ name: "nf_value", type: "numeric", precision: 15, scale: 2, nullable: true })
    nfValue!: number | null;

    // Termos de Recebimento

    @Column({ name: "provisional_receipt_sent", type: "boolean", nullable: true })
    provisionalReceiptSent!: boolean | null;

    @Column({ name: "final_receipt_sent", type: "boolean", nullable: true })
    finalReceiptSent!: boolean | null;

    // 1º Pagamento

    @Column({ name: "payment1_value", type: "numeric", precision: 15, scale: 2, nullable: true })
    payment1Value!: number | null;

    @Column({ name: "payment1_nup", type: "varchar", nullable: true })
    payment1Nup!: string | null;

    @Column({ name: "payment1_sent_date", type: "varchar", nullable: true })
    payment1SentDate!: string | null;

    // 2º Pagamento

    @Column({ name: "payment2_value", type: "numeric", precision: 15, scale: 2, nullable: true })
    payment2Value!: number | null;

    @Column({ name: "payment2_nup", type: "varchar", nullable: true })
    payment2Nup!: string | null;

    @Column({ name: "payment2_sent_date", type: "varchar", nullable: true })
    payment2SentDate!: string | null;

    @Column({ name: "payment2_deadline", type: "varchar", nullable: true })
    payment2Deadline!: string | null;

    // Totais / Status

    @Column({ name: "total_paid", type: "numeric", precision: 15, scale: 2, nullable: true })
    totalPaid!: number | null;

    @Column({ name: "payment_status", type: "varchar", nullable: true })
    paymentStatus!: string | null;

    // Lock (edicao concorrente)

    @Column({ name: "locked_by", type: "varchar", nullable: true })
    lockedBy!: string | null;

    @Column({ name: "locked_at", type: "timestamptz", nullable: true })
    lockedAt!: Date | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt!: Date | null;
}
