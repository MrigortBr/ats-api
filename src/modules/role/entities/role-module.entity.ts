import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Role } from "./role.entity";

/**
 * Módulos disponíveis no sistema.
 * Cada linha representa a permissão de um módulo para uma role.
 */
export type ModuleName = "transporte" | "tomo" | "rnm" | "combo" | "admin";

@Entity("role_modules")
export class RoleModule {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "role_id", type: "integer" })
    roleId!: number;

    @ManyToOne(() => Role, (r) => r.roleModules, { onDelete: "CASCADE" })
    @JoinColumn({ name: "role_id" })
    role!: Role;

    @Column({ type: "varchar" })
    module!: ModuleName;

    /** Se true, o usuário pode editar dados deste módulo (não só visualizar). */
    @Column({ name: "can_write", type: "boolean", default: false })
    canWrite!: boolean;
}
