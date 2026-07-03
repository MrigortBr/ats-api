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
                const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
                    lazyConnect: true,
                    enableOfflineQueue: false,
                    maxRetriesPerRequest: 1,
                });
                client.on("error", (err) =>
                    console.warn("[Redis] erro de conexão:", (err as Error).message),
                );
                return client;
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}
