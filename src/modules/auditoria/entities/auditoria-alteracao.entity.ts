import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export const MODULOS_AUDITADOS = ["transporte", "equipamentos", "empresa", "administracao", "outros"] as const;
export type ModuloAuditado = (typeof MODULOS_AUDITADOS)[number];

export const ACOES_DADOS = [
    "CRIAR", "ALTERAR", "EXCLUIR", "UPLOAD", "DOWNLOAD", "IMPORTAR", "BLOQUEIO", "REENVIO_CREDENCIAIS",
] as const;
export type AcaoDados = (typeof ACOES_DADOS)[number];

/**
 * Alteracoes e downloads de dados de negocio (transporte sanitario, equipamentos,
 * painel da empresa e cadastros administrativos). Somente inclusao.
 *
 * Tabela nova no schema "auditoria" (migration 1700000059000). Em claro ficam
 * apenas os campos de filtro; corpo enviado, mudancas antes/depois e origem
 * ficam cifrados (AES-256-GCM).
 */
@Entity({ schema: "auditoria", name: "alteracoes" })
export class AuditoriaAlteracao {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    @Column({ name: "ocorrido_em", type: "timestamptz", precision: 3 })
    ocorridoEm!: Date;

    @Column({ name: "user_id", type: "integer", nullable: true })
    userId!: number | null;

    @Column({ name: "user_email", type: "varchar", length: 255, nullable: true })
    userEmail!: string | null;

    @Column({ name: "modulo", type: "varchar", length: 30 })
    modulo!: ModuloAuditado;

    @Column({ name: "acao", type: "varchar", length: 30 })
    acao!: AcaoDados;

    @Column({ name: "metodo", type: "varchar", length: 10 })
    metodo!: string;

    /** Rota no formato do controller (ex.: /distribuicao/:ufId). */
    @Column({ name: "rota", type: "varchar", length: 255 })
    rota!: string;

    /** Parametros da rota (ex.: "ufId=12"). */
    @Column({ name: "registro_ref", type: "varchar", length: 255, nullable: true })
    registroRef!: string | null;

    @Column({ name: "status_http", type: "integer" })
    statusHttp!: number;

    @Column({ name: "sucesso", type: "boolean" })
    sucesso!: boolean;

    /** Quantas mudancas de entidade foram capturadas. */
    @Column({ name: "qtd_mudancas", type: "integer" })
    qtdMudancas!: number;

    @Column({ name: "detalhes_cifrados", type: "text" })
    detalhesCifrados!: string;

    @Column({ name: "detalhes_hash", type: "char", length: 64 })
    detalhesHash!: string;

    @Column({ name: "cripto_algoritmo", type: "varchar", length: 20 })
    criptoAlgoritmo!: string;

    @Column({ name: "cripto_chave_id", type: "varchar", length: 20 })
    criptoChaveId!: string;

    @Column({ name: "hash_anterior", type: "char", length: 64, nullable: true })
    hashAnterior!: string | null;

    @Column({ name: "hash", type: "char", length: 64, unique: true })
    hash!: string;
}
