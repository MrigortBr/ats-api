import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";

/**
 * Adiciona Cache-Control em rotas GET de listagem.
 * max-age=30 → browser não refaz a request nos próximos 30s.
 * stale-while-revalidate=60 → se expirou, serve o cache enquanto busca em background.
 *
 * Não aplica cache em rotas de autenticação ou mutation (POST/PUT/DELETE).
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
    private readonly CACHE_SECONDS = 30;
    private readonly SWR_SECONDS   = 60;

    private readonly NO_CACHE_PATHS = ["/auth", "/hospital/lookup"];

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request  = ctx.switchToHttp().getRequest<Request>();
        const response = ctx.switchToHttp().getResponse<Response>();

        const isGet      = request.method === "GET";
        const isExcluded = this.NO_CACHE_PATHS.some(p => request.path.startsWith(p));

        return next.handle().pipe(
            tap(() => {
                if (isGet && !isExcluded) {
                    response.setHeader(
                        "Cache-Control",
                        `private, max-age=${this.CACHE_SECONDS}, stale-while-revalidate=${this.SWR_SECONDS}`,
                    );
                } else {
                    response.setHeader("Cache-Control", "no-store");
                }
            }),
        );
    }
}
