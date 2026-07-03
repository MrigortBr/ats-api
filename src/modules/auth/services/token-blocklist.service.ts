import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../../redis/redis.module";

const PREFIX = "blocklist:jti:";

/**
 * Armazena JTIs de tokens revogados no Redis até o token expirar naturalmente.
 * Fail-open: se o Redis estiver indisponível, permite o acesso (evita lock-out).
 */
@Injectable()
export class TokenBlocklistService {
    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

    /** Revoga um token. ttlSeconds deve ser o tempo restante até o exp do JWT. */
    async revoke(jti: string, ttlSeconds: number): Promise<void> {
        if (ttlSeconds <= 0) return;
        try {
            await this.redis.setex(`${PREFIX}${jti}`, ttlSeconds, "1");
        } catch (err) {
            console.warn("[TokenBlocklist] falha ao revogar:", (err as Error).message);
        }
    }

    /** Retorna true se o token foi revogado. */
    async isRevoked(jti: string): Promise<boolean> {
        try {
            return (await this.redis.get(`${PREFIX}${jti}`)) !== null;
        } catch {
            return false; // fail-open
        }
    }
}
