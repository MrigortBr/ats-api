import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Hospital } from "../../hospital/entities/hospital.entity";

@Entity("rnm_document")
export class RnmDocument {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "hospital_id", type: "integer" })
    hospitalId!: number;

    @ManyToOne(() => Hospital)
    @JoinColumn({ name: "hospital_id" })
    hospital!: Hospital;

    @Column({ type: "varchar" })
    filename!: string;

    @Column({ type: "varchar" })
    mimetype!: string;

    @Column({ type: "integer" })
    size!: number;

    @Column({ type: "bytea" })
    data!: Buffer;

    @Column({ name: "uploaded_by", type: "varchar" })
    uploadedBy!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
