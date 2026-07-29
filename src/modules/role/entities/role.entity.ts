import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { RoleModule } from "./role-module.entity";

@Entity("roles")
export class Role {
    @PrimaryGeneratedColumn()
    id!: number;

    /** Identificador legível: 'admin', 'gestor_tomo', etc. */
    @Column({ type: "varchar", unique: true })
    name!: string;

    @Column({ type: "varchar", nullable: true })
    description!: string | null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    @OneToMany(() => require("./role-module.entity").RoleModule, (rm: RoleModule) => rm.role, { eager: true })
    roleModules!: RoleModule[];

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt!: Date | null;
}
