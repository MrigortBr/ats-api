import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Armazena metadados de documentos enviados pelos usuários.
 * O arquivo físico fica em /uploads/{module}/{entityId}/{uuid}.{ext} no volume da API.
 */
@Entity("document")
export class Document {
    @PrimaryGeneratedColumn()
    id!: number;

    /** Nome original do arquivo enviado pelo usuário. */
    @Column({ name: "original_name", type: "varchar" })
    originalName!: string;

    /** Caminho relativo no volume: uploads/{module}/{entityId}/{uuid}.{ext} */
    @Column({ name: "stored_path", type: "varchar" })
    storedPath!: string;

    @Column({ name: "mime_type", type: "varchar" })
    mimeType!: string;

    /** Ex: OFICIO_CONTEMPLACAO, NOTA_FISCAL, etc. */
    @Column({ name: "document_type", type: "varchar" })
    documentType!: string;

    /** 'combo' | 'tomo' | 'rnm' */
    @Column({ type: "varchar", length: 10 })
    module!: string;

    /** Email do usuário que fez o upload. */
    @Column({ name: "uploaded_by", type: "varchar" })
    uploadedBy!: string;

    /** Tamanho em bytes. */
    @Column({ name: "file_size", type: "integer", nullable: true })
    fileSize!: number | null;

    // ── FKs opcionais (apenas uma é preenchida por registro) ─────────────────

    @Column({ name: "consult_id", type: "integer", nullable: true })
    consultId!: number | null;

    @Column({ name: "tomo_id", type: "integer", nullable: true })
    tomoId!: number | null;

    @Column({ name: "rnm_id", type: "integer", nullable: true })
    rnmId!: number | null;

    @CreateDateColumn({ name: "uploaded_at" })
    uploadedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt!: Date | null;
}
