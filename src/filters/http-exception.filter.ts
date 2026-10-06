import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { Request, Response } from "express";

/**
 * Filtro global de excecoes.
 *
 * - HttpException (validacao, 401, 403, 404...): mantem o formato de resposta de sempre.
 * - Qualquer outro erro (TypeORM, TypeError, falha de rede...): responde 500 com mensagem
 *   generica e registra o erro real (com stack) so no log. Nada interno vai para o cliente.
 * - Todo erro 5xx (HTTP ou nao) e registrado no log e recebe um `errorId` (UUID) que vai
 *   tanto no log quanto na resposta, para cruzar o relato do usuario com a linha do log.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger("ExceptionFilter");

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | object = "Erro interno do servidor";

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.getResponse();
        }

        const errorId = status >= 500 ? randomUUID() : undefined;
        if (errorId) {
            const err = exception instanceof Error ? exception : new Error(String(exception));
            this.logger.error(
                `[${errorId}] ${request.method} ${request.url} -> ${err.message}`,
                err.stack,
            );
        }

        // Resposta ja iniciada (ex.: erro no meio de um stream): nao da pra reescrever.
        if (response.headersSent) return;

        response.status(status).json({
            statusCode: status,
            message,
            ...(errorId ? { errorId } : {}),
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}
