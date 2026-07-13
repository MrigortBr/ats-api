import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Hospital } from "./hospital.entity";
import { Company } from "../../company/entities/company.entity";

@Entity("combo_consult")
export class ComboConsult {
    @PrimaryGeneratedColumn()
    id!: number;

    // ── Chaves da planilha ───────────────────────────────────────────────────

    @Column({ name: "equip_key", type: "varchar", nullable: true, unique: true })
    equipKey!: string | null;

    @Index()
    @Column({ name: "estab_key", type: "varchar", nullable: true })
    estabKey!: string | null;

    // ── Localização ──────────────────────────────────────────────────────────

    @Column({ name: "uf_municipio", type: "varchar", nullable: true })
    ufMunicipio!: string | null;

    @Column({ type: "varchar", nullable: true })
    region!: string | null;

    @Index()
    @Column({ type: "varchar", length: 2, nullable: true })
    uf!: string | null;

    @Column({ type: "varchar", nullable: true })
    municipality!: string | null;

    @Column({ type: "varchar", nullable: true })
    ibge!: string | null;

    // ── Estabelecimento ──────────────────────────────────────────────────────

    @Column({ type: "varchar", nullable: true })
    cnes!: string | null;

    @Column({ name: "establishment_name", type: "varchar", nullable: true })
    establishmentName!: string | null;

    @Column({ type: "varchar", nullable: true })
    cnpj!: string | null;

    // ── Combo ────────────────────────────────────────────────────────────────

    @Column({ name: "combo_code", type: "varchar", nullable: true })
    comboCode!: string | null;

    @Column({ name: "combo_type", type: "varchar", nullable: true })
    comboType!: string | null;

    @Column({ type: "varchar", nullable: true })
    contract!: string | null;

    @Column({ name: "delivery_parcel", type: "varchar", nullable: true })
    deliveryParcel!: string | null;

    // ── Equipamento ──────────────────────────────────────────────────────────

    @Column({ name: "equipment_name", type: "varchar", nullable: true })
    equipmentName!: string | null;

    @Column({ name: "serial_number", type: "varchar", nullable: true })
    serialNumber!: string | null;

    // ── Datas ────────────────────────────────────────────────────────────────

    @Column({ name: "expedition_date", type: "varchar", nullable: true })
    expeditionDate!: string | null;

    @Column({ name: "delivery_forecast", type: "varchar", nullable: true })
    deliveryForecast!: string | null;

    @Column({ name: "delivery_date", type: "varchar", nullable: true })
    deliveryDate!: string | null;

    @Column({ name: "installation_date", type: "varchar", nullable: true })
    installationDate!: string | null;

    @Column({ name: "training_date", type: "varchar", nullable: true })
    trainingDate!: string | null;

    // ── Status ───────────────────────────────────────────────────────────────

    @Column({ name: "delivery_status", type: "varchar", nullable: true })
    deliveryStatus!: string | null;

    @Column({ name: "equipment_count", type: "integer", nullable: true })
    equipmentCount!: number | null;

    // ── Nota Fiscal ──────────────────────────────────────────────────────────

    @Column({ name: "nf_sent", type: "boolean", nullable: true })
    nfSent!: boolean | null;

    @Column({ name: "nf_number", type: "varchar", nullable: true })
    nfNumber!: string | null;

    @Column({ name: "nf_sent_date", type: "varchar", nullable: true })
    nfSentDate!: string | null;

    @Column({ name: "nf_value", type: "numeric", precision: 15, scale: 2, nullable: true })
    nfValue!: number | null;

    // ── Termos ───────────────────────────────────────────────────────────────

    @Column({ name: "provisional_receipt_sent", type: "boolean", nullable: true })
    provisionalReceiptSent!: boolean | null;

    @Column({ name: "final_receipt_sent", type: "boolean", nullable: true })
    finalReceiptSent!: boolean | null;

    // ── 1º Pagamento ─────────────────────────────────────────────────────────

    @Column({ name: "payment1_value", type: "numeric", precision: 15, scale: 2, nullable: true })
    payment1Value!: number | null;

    @Column({ name: "payment1_nup", type: "varchar", nullable: true })
    payment1Nup!: string | null;

    @Column({ name: "payment1_sent_date", type: "varchar", nullable: true })
    payment1SentDate!: string | null;

    // ── 2º Pagamento ─────────────────────────────────────────────────────────

    @Column({ name: "payment2_value", type: "numeric", precision: 15, scale: 2, nullable: true })
    payment2Value!: number | null;

    @Column({ name: "payment2_nup", type: "varchar", nullable: true })
    payment2Nup!: string | null;

    @Column({ name: "payment2_sent_date", type: "varchar", nullable: true })
    payment2SentDate!: string | null;

    @Column({ name: "payment2_deadline", type: "varchar", nullable: true })
    payment2Deadline!: string | null;

    // ── Totais ───────────────────────────────────────────────────────────────

    @Column({ name: "total_paid", type: "numeric", precision: 15, scale: 2, nullable: true })
    totalPaid!: number | null;

    @Column({ name: "payment_status", type: "varchar", nullable: true })
    paymentStatus!: string | null;

    // ── Contato ──────────────────────────────────────────────────────────────

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @Column({ type: "varchar", nullable: true })
    address!: string | null;

    @Column({ name: "manager_data", type: "varchar", nullable: true })
    managerData!: string | null;

    @Column({ name: "manager_phone", type: "varchar", nullable: true })
    managerPhone!: string | null;

    @Column({ name: "focal_point_data", type: "varchar", nullable: true })
    focalPointData!: string | null;

    @Column({ name: "focal_point_phone", type: "varchar", nullable: true })
    focalPointPhone!: string | null;

    @Column({ name: "establishment_email", type: "varchar", nullable: true })
    establishmentEmail!: string | null;

    @Column({ name: "focal_point_email", type: "varchar", nullable: true })
    focalPointEmail!: string | null;

    // ── Lock ─────────────────────────────────────────────────────────────────

    @Column({ name: "locked_by", type: "varchar", nullable: true })
    lockedBy!: string | null;

    @Column({ name: "locked_at", type: "timestamptz", nullable: true })
    lockedAt!: Date | null;

    // ── FK hospital ──────────────────────────────────────────────────────────

    @Index()
    @Column({ name: "hospital_id", type: "integer", nullable: true })
    hospitalId!: number | null;

    @ManyToOne(() => Hospital, { nullable: true, eager: false, onDelete: "SET NULL" })
    @JoinColumn({ name: "hospital_id" })
    hospital!: Hospital | null;

    // ── FK company ───────────────────────────────────────────────────────────

    @Index()
    @Column({ name: "company_id", type: "integer", nullable: true })
    companyId!: number | null;

    @ManyToOne(() => Company, { nullable: true, eager: false, onDelete: "SET NULL" })
    @JoinColumn({ name: "company_id" })
    company!: Company | null;

    // ── Timestamps ───────────────────────────────────────────────────────────

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt!: Date | null;
}
