import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    StreamableFile,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface StandardResponse<T = unknown> {
    timestamp: string;
    message: string;
    data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
    intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<StandardResponse<T>> {
        return next.handle().pipe(
            map((response) => {
                // StreamableFile must pass through without wrapping — interceptor
                // would otherwise serialize the binary as JSON and corrupt it.
                if (response instanceof StreamableFile) {
                    return response as unknown as StandardResponse<T>;
                }

                // void / 204 No Content — pass through so Node.js strips the
                // body automatically (required by HTTP spec for 204 responses).
                if (response === undefined || response === null) {
                    return response as unknown as StandardResponse<T>;
                }

                const isObject =
                    response !== null &&
                    response !== undefined &&
                    typeof response === "object" &&
                    !Array.isArray(response);

                const message =
                    isObject && "message" in (response as object)
                        ? String((response as Record<string, unknown>).message)
                        : "Success";

                const data: unknown = (() => {
                    if (!isObject) return response;

                    const { message: _msg, ...rest } = response as Record<string, unknown>;
                    return Object.keys(rest).length > 0 ? rest : null;
                })();

                return {
                    timestamp: new Date().toISOString(),
                    message,
                    data: data as T,
                };
            }),
        );
    }
}
