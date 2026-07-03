import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

/**
 * Módulo global que fornece um cliente ioredis injetável.
 * Configure REDIS_URL no .env  (ex: redis://localhost:6379).
 * Sem REDIS_URL usa o padrão local.
 */
@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: () => {
                const hasExplicitUrl = !!process.env.REDIS_URL;
                const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
                    lazyConnect: true,
                    enableOfflineQueue: false,
                    maxRetriesPerRequest: 1,
                    // Em dev sem REDIS_URL: tenta 1x e desiste (sem flood de logs)
                    retryStrategy: (times) => (hasExplicitUrl ? Math.min(times * 500, 5000) : null),
                });
                client.on("error", (err) => {
                    // Loga apenas se REDIS_URL foi configurada -- falha inesperada
                    if (hasExplicitUrl) console.warn("[Redis] erro de conexao:", (err as Error).message);
                });
                return client;
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}
