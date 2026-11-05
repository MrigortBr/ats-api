import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("acelerador_simdash_registro")
@Index("uq_acelerador_simdash_registro_cnes", ["cnes"], { unique: true })
export class AceleradorSimdashRegistro {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    cnes!: string;

    @Column({ name: "dados", type: "jsonb" })
    dados!: Record<string, unknown>;

    @Column({ name: "sincronizacao_id", type: "integer" })
    sincronizacaoId!: number;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
