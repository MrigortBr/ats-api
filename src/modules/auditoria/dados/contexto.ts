import { AsyncLocalStorage } from "async_hooks";

/** Mudanca em uma entidade capturada pelo subscriber do TypeORM durante a requisicao. */
export interface MudancaEntidade {
    operacao: "INSERIR" | "ALTERAR" | "EXCLUIR" | "EXCLUIR_LOGICO";
    entidade: string;
    tabela: string;
    registroId: string | null;
    /** ALTERAR: { campo: { antes, depois } }. INSERIR/EXCLUIR: valores do registro. */
    campos: Record<string, unknown>;
    /** true quando o "antes" nao estava disponivel (ex.: repo.update(id, dados)). */
    semValorAnterior?: boolean;
}

export interface ContextoAuditoria {
    mudancas: MudancaEntidade[];
    mudancasOmitidas: number;
}

export const MAX_MUDANCAS_POR_REQUISICAO = 100;

/**
 * Contexto por requisicao (AsyncLocalStorage). O interceptor abre o contexto;
 * o subscriber do TypeORM adiciona as mudancas feitas dentro dele. Gravacoes
 * fora de uma requisicao (seeds, rotinas agendadas) nao tem contexto e sao ignoradas.
 */
export const contextoAuditoria = new AsyncLocalStorage<ContextoAuditoria>();

export function registrarMudanca(m: MudancaEntidade): void {
    const ctx = contextoAuditoria.getStore();
    if (!ctx) return;
    if (ctx.mudancas.length >= MAX_MUDANCAS_POR_REQUISICAO) {
        ctx.mudancasOmitidas++;
        return;
    }
    ctx.mudancas.push(m);
}
