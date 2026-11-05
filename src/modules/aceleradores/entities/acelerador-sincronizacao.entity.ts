import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("acelerador_sincronizacao")
export class AceleradorSincronizacao {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", default: "SIMDASH" })
    fonte!: string;

    @Column({ name: "gerado_em_fonte", type: "timestamptz", nullable: true })
    geradoEmFonte!: Date | null;

    @Column({ name: "total_recebido", type: "integer" })
    totalRecebido!: number;

    @Column({ type: "jsonb", nullable: true })
    cobertura!: { producaoDesde: string | null; producaoMensalDe: string | null; producaoMensalAte: string | null } | null;

    @CreateDateColumn({ name: "sincronizado_em", type: "timestamptz" })
    sincronizadoEm!: Date;
}
