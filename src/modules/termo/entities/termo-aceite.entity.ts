import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Registro de assinatura do Termo de Uso (somente inclusao).
 *
 * Tabela nova em schema separado ("auditoria") — nao altera nenhuma tabela
 * existente. UPDATE, DELETE e TRUNCATE sao bloqueados por trigger no banco
 * (migration 1700000057000).
 *
 * Em claro ficam apenas a identificacao do usuario, o termo e os horarios.
 * IP, navegador/dispositivo e localizacao ficam em `dadosAcessoCifrados`
 * (AES-256-GCM, ver auditoria-cripto.ts). Cada linha guarda o hash da anterior.
 */
@Entity({ schema: "auditoria", name: "termo_aceites" })
export class TermoAceite {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id!: string;

    // ── Usuario ───────────────────────────────────────────────────────────────
    @Column({ name: "user_id", type: "integer" })
    userId!: number;

    @Column({ name: "user_nome", type: "varchar", length: 255 })
    userNome!: string;

    @Column({ name: "user_email", type: "varchar", length: 255 })
    userEmail!: string;

    // ── Termo ─────────────────────────────────────────────────────────────────
    @Column({ name: "termo_versao", type: "varchar", length: 20 })
    termoVersao!: string;

    @Column({ name: "termo_hash", type: "char", length: 64 })
    termoHash!: string;

    @Column({ name: "itens", type: "jsonb" })
    itens!: string[];

    // ── Momento da assinatura ─────────────────────────────────────────────────
    /** Horario oficial: relogio do servidor no recebimento do aceite. */
    @Column({ name: "assinado_em_servidor", type: "timestamptz", precision: 3 })
    assinadoEmServidor!: Date;

    /** Relogio do navegador quando o checkbox foi marcado (referencia). */
    @Column({ name: "assinado_em_cliente", type: "timestamptz", precision: 3 })
    assinadoEmCliente!: Date;

    /** Texto exato enviado pelo navegador, preservando o fuso informado. */
    @Column({ name: "assinado_em_cliente_texto", type: "varchar", length: 40 })
    assinadoEmClienteTexto!: string;

    // ── Dados de acesso (cifrados) ───────────────────────────────────────────
    /** JSON com IP, cabecalhos, navegador/dispositivo e localizacao — AES-256-GCM, base64. */
    @Column({ name: "dados_acesso_cifrados", type: "text" })
    dadosAcessoCifrados!: string;

    /** SHA-256 do JSON em claro — permite conferir o conteudo apos decifrar. */
    @Column({ name: "dados_acesso_hash", type: "char", length: 64 })
    dadosAcessoHash!: string;

    @Column({ name: "cripto_algoritmo", type: "varchar", length: 20 })
    criptoAlgoritmo!: string;

    /** Identificador da chave usada (AUDITORIA_CHAVE_ID) — suporta rotacao. */
    @Column({ name: "cripto_chave_id", type: "varchar", length: 20 })
    criptoChaveId!: string;

    // ── Integridade ───────────────────────────────────────────────────────────
    @Column({ name: "hash_anterior", type: "char", length: 64, nullable: true })
    hashAnterior!: string | null;

    @Column({ name: "hash", type: "char", length: 64, unique: true })
    hash!: string;
}
