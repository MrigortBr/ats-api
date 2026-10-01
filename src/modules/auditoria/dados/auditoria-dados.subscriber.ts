import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import type {
    DataSource,
    EntityMetadata,
    EntitySubscriberInterface,
    InsertEvent,
    ObjectLiteral,
    RemoveEvent,
    SoftRemoveEvent,
    UpdateEvent,
} from "typeorm";
import { registrarMudanca, contextoAuditoria, type MudancaEntidade } from "./contexto";
import { chaveSensivel, iguais, OMITIDO, sanitizarValor } from "./sanitizar";

/** Colunas que mudam em toda gravacao e so poluem o diff. */
const IGNORAR = new Set(["updatedAt", "updated_at"]);

function tabelaDe(m: EntityMetadata): string {
    return m.schema ? `${m.schema}.${m.tableName}` : m.tableName;
}

function idDe(m: EntityMetadata, ...candidatos: (ObjectLiteral | undefined | null)[]): string | null {
    for (const c of candidatos) {
        if (!c) continue;
        const partes = m.primaryColumns.map((col) => col.getEntityValue(c)).filter((v) => v !== undefined && v !== null);
        if (partes.length) return partes.map(String).join(",");
    }
    return null;
}

function valoresColunas(m: EntityMetadata, entidade: ObjectLiteral): Record<string, unknown> {
    const saida: Record<string, unknown> = {};
    for (const col of m.columns) {
        const nome = col.propertyName;
        if (IGNORAR.has(nome)) continue;
        const v = col.getEntityValue(entidade);
        if (v === undefined) continue;
        saida[nome] = chaveSensivel(nome) ? OMITIDO : sanitizarValor(v);
    }
    return saida;
}

/**
 * Captura insercoes, alteracoes e exclusoes feitas pelo TypeORM durante uma
 * requisicao auditada e as anexa ao contexto (ver AuditoriaDadosInterceptor).
 *
 * Cobre repository.save / remove / softRemove e update/softDelete por QueryBuilder
 * (nesses ultimos o TypeORM nao fornece o valor anterior). SQL cru (manager.query)
 * nao passa por aqui — fica registrado apenas pela requisicao.
 */
@Injectable()
export class AuditoriaDadosSubscriber implements EntitySubscriberInterface {
    constructor(@InjectDataSource() dataSource: DataSource) {
        dataSource.subscribers.push(this);
    }

    private auditavel(m: EntityMetadata | undefined): m is EntityMetadata {
        // Tabelas da propria auditoria nunca entram (evita recursao).
        return !!m && m.schema !== "auditoria" && !!contextoAuditoria.getStore();
    }

    afterInsert(event: InsertEvent<ObjectLiteral>): void {
        if (!this.auditavel(event.metadata) || !event.entity) return;
        registrarMudanca({
            operacao: "INSERIR",
            entidade: event.metadata.name,
            tabela: tabelaDe(event.metadata),
            registroId: idDe(event.metadata, event.entity),
            campos: valoresColunas(event.metadata, event.entity),
        });
    }

    afterUpdate(event: UpdateEvent<ObjectLiteral>): void {
        if (!this.auditavel(event.metadata)) return;
        const m = event.metadata;
        const depois = event.entity as ObjectLiteral | undefined;
        const antes = event.databaseEntity;
        const campos: Record<string, unknown> = {};

        if (antes && depois) {
            // repository.save em entidade carregada: diff campo a campo.
            const cols = event.updatedColumns.length ? event.updatedColumns : m.columns;
            for (const col of cols) {
                const nome = col.propertyName;
                if (IGNORAR.has(nome)) continue;
                if (chaveSensivel(nome)) { campos[nome] = { antes: OMITIDO, depois: OMITIDO }; continue; }
                const a = sanitizarValor(col.getEntityValue(antes));
                const d = sanitizarValor(col.getEntityValue(depois));
                if (!iguais(a, d)) campos[nome] = { antes: a, depois: d };
            }
            if (Object.keys(campos).length === 0) return;
            registrarMudanca({ operacao: "ALTERAR", entidade: m.name, tabela: tabelaDe(m), registroId: idDe(m, depois, antes), campos });
            return;
        }

        if (depois) {
            // repository.update(id, dados): so os valores aplicados.
            for (const [nome, v] of Object.entries(depois)) {
                if (IGNORAR.has(nome) || v === undefined) continue;
                campos[nome] = { depois: chaveSensivel(nome) ? OMITIDO : sanitizarValor(v) };
            }
            if (Object.keys(campos).length === 0) return;
            registrarMudanca({ operacao: "ALTERAR", entidade: m.name, tabela: tabelaDe(m), registroId: idDe(m, depois), campos, semValorAnterior: true });
        }
    }

    afterRemove(event: RemoveEvent<ObjectLiteral>): void {
        this.exclusao("EXCLUIR", event);
    }

    afterSoftRemove(event: SoftRemoveEvent<ObjectLiteral>): void {
        this.exclusao("EXCLUIR_LOGICO", event);
    }

    private exclusao(operacao: MudancaEntidade["operacao"], event: RemoveEvent<ObjectLiteral> | SoftRemoveEvent<ObjectLiteral>) {
        if (!this.auditavel(event.metadata)) return;
        const m = event.metadata;
        const registro = event.databaseEntity ?? event.entity;
        registrarMudanca({
            operacao,
            entidade: m.name,
            tabela: tabelaDe(m),
            registroId: event.entityId !== undefined && event.entityId !== null
                ? String(typeof event.entityId === "object" ? Object.values(event.entityId).join(",") : event.entityId)
                : idDe(m, registro),
            campos: registro ? valoresColunas(m, registro) : {},
        });
    }
}
