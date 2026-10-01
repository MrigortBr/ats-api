import {
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable,
    NestInterceptor,
    StreamableFile,
} from "@nestjs/common";
import { Observable, from, lastValueFrom } from "rxjs";
import type { Request, Response } from "express";
import { contextoAuditoria, type ContextoAuditoria } from "./contexto";
import { classificar, referenciaRegistro } from "./classificar";
import { sanitizarValor } from "./sanitizar";
import { AuditoriaAlteracoesService } from "./auditoria-alteracoes.service";
import { extractRequestOrigin } from "../../termo/request-origin";

type ReqAuditada = Request & {
    user?: { id?: number; email?: string };
    file?: { originalname?: string; mimetype?: string; size?: number };
};

/** Resume a resposta sem copiar dados volumosos. */
function resumoResposta(r: unknown): Record<string, unknown> | null {
    if (r === undefined || r === null) return null;
    if (r instanceof StreamableFile) return { arquivo: true };
    if (Array.isArray(r)) return { itens: r.length };
    if (typeof r === "object") {
        let o = r as Record<string, unknown>;
        // Resposta ja embrulhada pelo ResponseInterceptor ({ timestamp, message, data }).
        if ("timestamp" in o && "data" in o) {
            if (o.data === null || o.data === undefined) return { mensagem: o.message ?? null };
            if (Array.isArray(o.data) || typeof o.data !== "object") return resumoResposta(o.data);
            o = { ...(o.data as Record<string, unknown>), message: o.message };
        }
        const resumo: Record<string, unknown> = {};
        for (const k of ["id", "message", "inserted", "updated", "total", "count", "aplicados", "importados"]) {
            if (k in o && (typeof o[k] !== "object" || o[k] === null)) resumo[k] = o[k];
        }
        return Object.keys(resumo).length ? resumo : { objeto: true };
    }
    return { valor: sanitizarValor(r) };
}

/**
 * Audita escritas (POST/PUT/PATCH/DELETE) e downloads de arquivos dos modulos
 * de negocio. Abre um contexto por requisicao para o subscriber do TypeORM
 * anexar as mudancas antes/depois, e grava um registro em auditoria.alteracoes
 * ao final — com sucesso ou com erro (ex.: validacao recusada pelo service).
 *
 * Requisicoes barradas por guard (401/403) nao chegam aqui.
 * O registro e "best-effort": se a gravacao da auditoria falhar, a resposta ao
 * usuario nao e afetada (o erro vai para o log).
 */
@Injectable()
export class AuditoriaDadosInterceptor implements NestInterceptor {
    constructor(private readonly alteracoes: AuditoriaAlteracoesService) {}

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (ctx.getType() !== "http") return next.handle();

        const req = ctx.switchToHttp().getRequest<ReqAuditada>();
        const res = ctx.switchToHttp().getResponse<Response>();
        const caminho = req.path ?? req.url;
        // O multer (FileInterceptor) roda depois deste interceptor: aqui so decidimos
        // se auditamos; arquivo, corpo multipart e a acao final sao lidos ao final.
        if (!classificar(req.method, caminho, false)) return next.handle();

        const contexto: ContextoAuditoria = { mudancas: [], mudancasOmitidas: 0 };

        const executar = async (): Promise<unknown> => {
            let resultado: unknown;
            let erro: unknown = null;
            try {
                resultado = await contextoAuditoria.run(contexto, () => lastValueFrom(next.handle(), { defaultValue: undefined }));
            } catch (e) {
                erro = e;
            }

            const status = erro
                ? (erro instanceof HttpException ? erro.getStatus() : 500)
                : res.statusCode;

            const classe = classificar(req.method, caminho, !!req.file)!;
            const user = req.user;
            await this.alteracoes.registrarSemFalhar({
                usuario: user?.id && user.email ? { id: user.id, email: user.email } : null,
                modulo: classe.modulo,
                acao: classe.acao,
                metodo: req.method.toUpperCase(),
                rota: (req.baseUrl ?? "") + ((req.route as { path?: string } | undefined)?.path ?? req.path),
                registroRef: referenciaRegistro(req.params as Record<string, string>),
                statusHttp: status,
                sucesso: !erro && status < 400,
                detalhes: {
                    origem: extractRequestOrigin(req),
                    url: req.originalUrl ?? req.url,
                    parametros: { ...(req.params as Record<string, string>) },
                    consulta: sanitizarValor(req.query ?? {}) as Record<string, unknown>,
                    corpo: classe.acao === "DOWNLOAD" ? null : sanitizarValor(req.body ?? null),
                    arquivo: req.file
                        ? { nome: Buffer.from(req.file.originalname ?? "", "latin1").toString("utf8"), tipo: req.file.mimetype ?? "", tamanho: req.file.size ?? 0 }
                        : null,
                    mudancas: contexto.mudancas,
                    mudancasOmitidas: contexto.mudancasOmitidas,
                    resposta: erro ? null : resumoResposta(resultado),
                    erro: erro ? String((erro as Error)?.message ?? erro).slice(0, 500) : null,
                },
            });

            if (erro) throw erro;
            return resultado;
        };

        return from(executar());
    }
}
