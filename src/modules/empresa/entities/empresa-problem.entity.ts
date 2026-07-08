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
import { HospitalCombo } from "../../hospital/entities/hospital-combo.entity";

@Entity("company_problem_reports")
export class EmpresaProblem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "combo_id", type: "integer" })
    comboId!: number;

    @ManyToOne(() => HospitalCombo, { onDelete: "CASCADE", eager: false })
    @JoinColumn({ name: "combo_id" })
    combo!: HospitalCombo;

    @Column({ type: "text", nullable: true })
    queixa!: string | null;

    @Column({ name: "motivo_unidade", type: "varchar", nullable: true })
    motivoUnidade!: string | null;

    @Column({ name: "proposta_solucao_ms", type: "text", nullable: true })
    propostaSolucaoMs!: string | null;

    @Column({ type: "varchar", nullable: true })
    status!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt!: Date | null;
}
