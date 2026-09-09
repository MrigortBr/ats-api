import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/**
 * Convênios de equipamentos (Cirurgia Robótica, Mamógrafo, PET/CT) — fonte SISCONV.
 * Somente leitura no sistema: dados vêm de planilha, atualizados via reimportação (admin).
 */
@Entity("equipamento_convenio_sisconv")
export class EquipamentoConvenioSisconv {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: "varchar" })
    equipamento!: string; // 'Cirurgia Robótica' | 'Mamógrafo' | 'PET/CT'

    @Column({ type: "varchar" })
    convenio!: string;

    @Column({ type: "varchar" })
    entidade!: string;

    @Index()
    @Column({ type: "varchar" })
    uf!: string;

    @Column({ type: "varchar" })
    municipio!: string;

    @Column({ name: "data_publicacao", type: "varchar", nullable: true })
    dataPublicacao!: string | null;

    @Column({ name: "valor_global", type: "numeric", precision: 14, scale: 2, nullable: true })
    valorGlobal!: string | null;

    @Column({ type: "varchar" })
    situacao!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
