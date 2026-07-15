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
import { Role } from "../../role/entities/role.entity";
import { Company } from "../../company/entities/company.entity";

@Entity("users")
export class Users {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar" })
    surname!: string;

    @Column({ type: "varchar", unique: true })
    email!: string;

    @Column({ name: "password", type: "varchar" })
    password!: string;

    // RBAC dinamico

    @Column({ name: "role_id", type: "integer", nullable: true })
    roleId!: number | null;

    @ManyToOne(() => Role, { nullable: true, eager: true })
    @JoinColumn({ name: "role_id" })
    roleEntity!: Role | null;

    @Column({ name: "company_id", type: "integer", nullable: true })
    companyId!: number | null;

    @ManyToOne(() => Company, { nullable: true, eager: false })
    @JoinColumn({ name: "company_id" })
    company!: Company | null;

    /**
     * Modulos adicionais ou removidos por override individual.
     * Formato JSON array: ["transporte", "combo"]
     * Modulos efetivos = role.modules uniao modulesOverride
     */
    @Column({ name: "modules_override", type: "jsonb", nullable: true, default: null })
    modulesOverride!: string[] | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt!: Date | null;
}
