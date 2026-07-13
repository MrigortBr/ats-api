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
import { ComboConsult } from "../../hospital/entities/combo-consult.entity";

@Entity("company_problem_reports")
export class EmpresaProblem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "consult_id", type: "integer", nullable: true })
    consultId!: number | null;

    @ManyToOne(() => ComboConsult, { onDelete: "SET NULL", eager: false, nullable: true })
    @JoinColumn({ name: "consult_id" })
    consult!: ComboConsult | null;

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
