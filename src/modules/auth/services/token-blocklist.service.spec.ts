import { TokenBlocklistService } from "./token-blocklist.service";

// ─── mock Redis ───────────────────────────────────────────────────────────────

function makeRedis(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        setex: jest.fn().mockResolvedValue("OK"),
        get:   jest.fn().mockResolvedValue(null),
        ...overrides,
    };
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe("TokenBlocklistService", () => {
    let redis: ReturnType<typeof makeRedis>;
    let service: TokenBlocklistService;

    beforeEach(() => {
        redis   = makeRedis();
        service = new TokenBlocklistService(redis as any);
    });

    // ── revoke ─────────────────────────────────────────────────────────────────

    describe("revoke", () => {
        it("armazena JTI no Redis com TTL correto", async () => {
            await service.revoke("jti-abc", 3600);

            expect(redis.setex).toHaveBeenCalledWith("blocklist:jti:jti-abc", 3600, "1");
        });

        it("não chama setex quando ttlSeconds <= 0", async () => {
            await service.revoke("jti-abc", 0);
            expect(redis.setex).not.toHaveBeenCalled();

            await service.revoke("jti-abc", -1);
            expect(redis.setex).not.toHaveBeenCalled();
        });

        it("falha silenciosa quando Redis está indisponível (fail-open)", async () => {
            redis.setex = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));

            // Não deve lançar — apenas loga o warning
            await expect(service.revoke("jti-xyz", 300)).resolves.not.toThrow();
        });
    });

    // ── isRevoked ──────────────────────────────────────────────────────────────

    describe("isRevoked", () => {
        it("retorna true quando token está na blocklist", async () => {
            redis.get = jest.fn().mockResolvedValue("1");

            const result = await service.isRevoked("jti-abc");
            expect(result).toBe(true);
            expect(redis.get).toHaveBeenCalledWith("blocklist:jti:jti-abc");
        });

        it("retorna false quando token não está na blocklist", async () => {
            redis.get = jest.fn().mockResolvedValue(null);

            const result = await service.isRevoked("jti-xyz");
            expect(result).toBe(false);
        });

        it("retorna false (fail-open) quando Redis está indisponível", async () => {
            redis.get = jest.fn().mockRejectedValue(new Error("timeout"));

            const result = await service.isRevoked("jti-err");
            expect(result).toBe(false);
        });
    });

    // ── round-trip revoke → isRevoked ──────────────────────────────────────────

    describe("round-trip", () => {
        it("token revogado é detectado como revogado em seguida", async () => {
            // Simula Redis em memória
            const store: Record<string, string> = {};
            redis.setex = jest.fn().mockImplementation((_key: string, _ttl: number, _val: string) => {
                store[_key] = _val;
                return Promise.resolve("OK");
            });
            redis.get = jest.fn().mockImplementation((_key: string) => {
                return Promise.resolve(store[_key] ?? null);
            });

            await service.revoke("jti-round", 60);
            const revoked = await service.isRevoked("jti-round");

            expect(revoked).toBe(true);
        });

        it("token não revogado não é detectado como revogado", async () => {
            const result = await service.isRevoked("jti-never-revoked");
            expect(result).toBe(false);
        });
    });
});
