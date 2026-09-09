import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Tipos de atendimento (Internação, Ambulatorial, SADT, Urgência, Vigilância em Saúde,
 * Regulação, Outros) que cada estabelecimento (por CNES) oferece, segundo cadastro do CNES/SUS.
 * Importado uma única vez a partir de planilhas exportadas (TOMO, RNM, Combo) — não é
 * exclusivo de nenhum módulo, então fica desacoplado de Hospital/HospitalTomo/HospitalRnm/
 * ComboConsult e é casado por CNES em tempo de leitura.
 */
@Entity("hospital_tipo_atendimento")
export class HospitalTipoAtendimento {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 7, unique: true })
    cnes!: string;

    @Column({ type: "jsonb" })
    tipos!: string[];

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
