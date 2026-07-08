import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Hospital } from "./hospital.entity";
import { Company } from "../../company/entities/company.entity";
import { ComboEquipamento } from "./combo-equipamento.entity";

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
    comboType!: string;

    @Column({ type: "varchar", nullable: true })
    contract!: string | null;

    @Column({ name: "delivery_parcel", type: "varchar", nullable: true })
    deliveryParcel!: string | null;

    // Datas

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

    // Situacao / Equipamentos

    @Column({ name: "delivery_status", type: "varchar", nullable: true })
    deliveryStatus!: string | null;

    @Column({ name: "equipment_count", type: "integer", nullable: true })
    equipmentCount!: number | null;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    // Endereco / Contato

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

    @Column({ name: "focal_point_email", type: "varchar", nullable: true })
    focalPointEmail!: string | null;

    @Column({ name: "establishment_email", type: "varchar", nullable: true })
    establishmentEmail!: string | null;

    // Multi-tenant

    @Column({ name: "company_id", type: "integer", nullable: true })
    companyId!: number | null;

    @ManyToOne(() => Company, { nullable: true, eager: false })
    @JoinColumn({ name: "company_id" })
    company!: Company | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => ComboEquipamento, (e) => e.combo, { cascade: false })
    equipamentos!: ComboEquipamento[];

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt!: Date | null;
}
