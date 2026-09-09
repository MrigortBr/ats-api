import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

/**
 * Convênios de equipamentos (Cirurgia Robótica, Mamógrafo, PET/CT) — fonte SISPRO.
 * Somente leitura no sistema: dados vêm de planilha, atualizados via reimportação (admin).
 * Linhas sem UF/entidade preenchidas na planilha entram marcadas como "pendente" (aguardando alocação).
 */
@Entity("equipamento_convenio_sispro")
export class EquipamentoConvenioSispro {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({ type: "varchar" })
    equipamento!: string; // 'Cirurgia Robótica' | 'Mamógrafo' | 'PET/CT'

    @Column({ type: "varchar", nullable: true })
    regiao!: string | null;

    @Index()
    @Column({ type: "varchar", nullable: true })
    uf!: string | null;

    @Column({ type: "varchar", nullable: true })
    municipio!: string | null;

    @Column({ type: "varchar", nullable: true })
    entidade!: string | null;

    @Column({ name: "nu_proposta", type: "varchar", nullable: true })
    nuProposta!: string | null;

    @Column({ name: "nu_processo", type: "varchar", nullable: true })
    nuProcesso!: string | null;

    @Column({ type: "varchar", nullable: true })
    convenio!: string | null;

    @Column({ type: "varchar", nullable: true })
    ano!: string | null;

    /** true quando a linha da planilha veio sem UF/entidade — aguardando alocação. */
    @Column({ type: "boolean", default: false })
    pendente!: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
