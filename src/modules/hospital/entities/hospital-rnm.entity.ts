import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Hospital } from "./hospital.entity";

@Entity("hospital_rnm")
export class HospitalRnm {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "hospital_id", type: "integer", unique: true })
    hospitalId!: number;

    @OneToOne(() => Hospital, (h) => h.rnm)
    @JoinColumn({ name: "hospital_id" })
    hospital!: Hospital;

    // ── Fields mirroring hospital_tomo ────────────────────────────────────────

    @Column({ type: "varchar", nullable: true })
    status!: string | null;

    @Column({ type: "varchar", nullable: true })
    contract!: string | null;

    @Column({ name: "structure_90_days", type: "varchar", nullable: true })
    structure90Days!: string | null;

    @Column({ name: "form_sent", type: "varchar", nullable: true })
    formSent!: string | null;

    @Column({ name: "form_received", type: "varchar", nullable: true })
    formReceived!: string | null;

    @Column({ name: "contact_notes", type: "text", nullable: true })
    contactNotes!: string | null;

    @Column({ name: "contact_responsible", type: "varchar", nullable: true })
    contactResponsible!: string | null;

    @Column({ name: "priority_group", type: "varchar", nullable: true })
    priorityGroup!: string | null;

    @Column({ name: "delivery_order", type: "integer", nullable: true })
    deliveryOrder!: number | null;

    @Column({ type: "varchar", nullable: true })
    construction!: string | null;

    @Column({ type: "varchar", nullable: true })
    installed!: string | null;

    @Column({ name: "ebserh_priority", type: "boolean", nullable: true })
    ebserhPriority!: boolean | null;

    @Column({ name: "delivery_date", type: "varchar", nullable: true })
    deliveryDate!: string | null;

    // ── RNM-specific ──────────────────────────────────────────────────────────

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt!: Date | null;
}
