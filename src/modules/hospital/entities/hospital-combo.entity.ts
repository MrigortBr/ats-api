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
import { Hospital } from "./hospital.entity";

@Entity("hospital_combo")
export class HospitalCombo {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "hospital_id", type: "integer" })
    hospitalId!: number;

    @ManyToOne(() => Hospital, (h) => h.combos)
    @JoinColumn({ name: "hospital_id" })
    hospital!: Hospital;

    @Column({ name: "combo_type", type: "varchar" })
    comboType!: string; // 'COMBO CIRURGIA' | 'COMBO OFTALMO'

    @Column({ type: "varchar", nullable: true })
    contract!: string | null; // '1º Contrato' | '2º Contrato' | 'Suspenso'

    @Column({ name: "delivery_parcel", type: "varchar", nullable: true })
    deliveryParcel!: string | null; // '1ª PARCELA' | '2ª PARCELA' | ...

    @Column({ name: "delivery_date", type: "varchar", nullable: true })
    deliveryDate!: string | null; // preenchida = Entregue, null = Pendente

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt!: Date | null;
}
