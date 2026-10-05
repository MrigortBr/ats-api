import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { Sessao } from "../entities/sessao.entity";
import { Users } from "../entities/user.entity";
import { AuditoriaEventosService } from "../../auditoria/auditoria-eventos.service";
import type { RequestOrigin } from "../../termo/request-origin";

export type MotivoRevogacao =
    | "logout"
    | "rotacionada"
    | "reuso"
    | "usuario_removido"
    | "senha_alterada"
    | "expirada";

export interface SessaoEmitida {
    /** Valor bruto do refresh token — so existe aqui, vai direto para o cookie HttpOnly. */
    refreshToken: string;
    /** Id da sessao (claim `sid` do JWT). */
    sid: string;
    /** Token CSRF desta emissao (claim `csrf` do JWT e hash na sessao). */
    csrf: string;
}

/** Janela em que o reuso de um token recem-rotacionado e tratado como corrida entre abas. */
const JANELA_CONCORRENCIA_MS = 10_000;
/** Intervalo minimo entre atualizacoes de last_used_at (evita escrita a cada request). */
const INTERVALO_TOUCH_MS = 60_000;

export const sha256Hex = (valor: string): string => createHash("sha256").update(valor, "utf8").digest("hex");

function minutos(nome: string, padrao: number): number {
    const n = Number(process.env[nome]);
    return Number.isFinite(n) && n > 0 ? n : padrao;
}

/** Tempo sem nenhuma requisicao autenticada antes de a sessao cair. Padrao: 2 h. */
export const idleMs = (): number => minutos("SESSAO_IDLE_MIN", 120) * 60_000;
/** Teto absoluto desde o login, mesmo com uso continuo. Padrao: 24 h. */
export const absolutoMs = (): number => minutos("SESSAO_ABSOLUTE_MIN", 24 * 60) * 60_000;

/** Fim da sessao: o que vier primeiro entre inatividade e teto absoluto. */
export function calcularExpiracao(inicio: Date, agora: Date): Date {
    return new Date(Math.min(agora.getTime() + idleMs(), inicio.getTime() + absolutoMs()));
}

function iguais(a: string, b: string): boolean {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
}

@Injectable()
export class SessaoService {
    private readonly logger = new Logger(SessaoService.name);

    constructor(
        @InjectRepository(Sessao) private readonly sessoes: Repository<Sessao>,
        @InjectRepository(Users) private readonly users: Repository<Users>,
        private readonly auditoria: AuditoriaEventosService,
    ) {}

    /** Cria uma sessao nova (login) ou o proximo elo da cadeia (refresh, com `inicio` original). */
    async criar(userId: number, inicio?: Date): Promise<SessaoEmitida> {
        const agora = new Date();
        const refreshToken = randomBytes(32).toString("base64url");
        const csrf = randomBytes(32).toString("hex");
        const inicioSessao = inicio ?? agora;
        const salva = await this.sessoes.save(
            this.sessoes.create({
                userId,
                tokenHash: sha256Hex(refreshToken),
                csrfHash: sha256Hex(csrf),
                sessionStartedAt: inicioSessao,
                lastUsedAt: agora,
                expiresAt: calcularExpiracao(inicioSessao, agora),
                revokedAt: null,
                revokedReason: null,
            }),
        );
        return { refreshToken, sid: salva.id, csrf };
    }

    /** Sessao ativa a partir do refresh token (sem alterar nada). */
    async buscarAtivaPorToken(refreshToken: string): Promise<Sessao | null> {
        const s = await this.sessoes.findOne({
            where: { tokenHash: sha256Hex(refreshToken), revokedAt: IsNull() },
        });
        if (!s) return null;
        const agora = Date.now();
        if (s.expiresAt.getTime() <= agora) return null;
        if (s.sessionStartedAt.getTime() + absolutoMs() <= agora) return null;
        return s;
    }

    /** Confere o header X-CSRF-Token contra o hash guardado na sessao. */
    csrfConfere(sessao: Sessao, header: string | undefined): boolean {
        if (!header) return false;
        return iguais(sha256Hex(header), sessao.csrfHash);
    }

    /**
     * Valida a sessao do access token (claim `sid`) a cada request.
     * Renova a inatividade, no maximo 1 escrita por minuto por sessao.
     */
    async validar(sid: string, userId: number): Promise<boolean> {
        const s = await this.sessoes.findOne({ where: { id: sid, userId, revokedAt: IsNull() } });
        if (!s) return false;
        const agora = new Date();
        if (s.expiresAt.getTime() <= agora.getTime()) return false;
        if (s.sessionStartedAt.getTime() + absolutoMs() <= agora.getTime()) return false;

        if (agora.getTime() - s.lastUsedAt.getTime() > INTERVALO_TOUCH_MS) {
            await this.sessoes
                .update(
                    { id: sid, revokedAt: IsNull() },
                    { lastUsedAt: agora, expiresAt: calcularExpiracao(s.sessionStartedAt, agora) },
                )
                .catch((err: Error) => this.logger.warn(`Falha ao atualizar last_used_at: ${err.message}`));
        }
        return true;
    }

    /**
     * Rotaciona o refresh token: revoga o recebido (UPDATE atomico) e emite o proximo.
     * Reuso de token ja revogado derruba todas as sessoes do usuario e gera evento de auditoria.
     */
    async rotacionar(refreshToken: string, origem: RequestOrigin): Promise<SessaoEmitida & { userId: number }> {
        const hash = sha256Hex(refreshToken);
        const agora = new Date();

        const resultado = await this.sessoes
            .createQueryBuilder()
            .update(Sessao)
            .set({ revokedAt: agora, revokedReason: "rotacionada" })
            .where("token_hash = :hash AND revoked_at IS NULL", { hash })
            .returning(["id", "user_id", "session_started_at", "expires_at"])
            .execute();
        const linha = (resultado.raw as Array<Record<string, unknown>>)[0];

        if (!linha) {
            await this.tratarTokenInvalido(hash, origem);
            throw new UnauthorizedException("Sessao invalida ou expirada.");
        }

        const userId = Number(linha.user_id);
        const inicio = new Date(linha.session_started_at as string | Date);
        const expiraEm = new Date(linha.expires_at as string | Date);
        if (expiraEm.getTime() <= agora.getTime() || inicio.getTime() + absolutoMs() <= agora.getTime()) {
            await this.sessoes.update({ tokenHash: hash }, { revokedReason: "expirada" });
            throw new UnauthorizedException("Sessao invalida ou expirada.");
        }

        const nova = await this.criar(userId, inicio);
        return { ...nova, userId };
    }

    /** Token nao encontrado como ativo: pode ser lixo, reuso ou corrida entre abas. */
    private async tratarTokenInvalido(hash: string, origem: RequestOrigin): Promise<void> {
        const existente = await this.sessoes.findOne({ where: { tokenHash: hash } });
        if (!existente) return;

        const revogadaHa = existente.revokedAt ? Date.now() - existente.revokedAt.getTime() : Infinity;
        if (existente.revokedReason === "rotacionada" && revogadaHa < JANELA_CONCORRENCIA_MS) {
            // Duas abas renovando ao mesmo tempo: a segunda chegou com o cookie antigo.
            throw new ConflictException("Renovacao concorrente — repita a requisicao.");
        }
        // Revogada por logout, expiracao, troca de senha etc.: nao e sinal de roubo.
        if (existente.revokedReason !== "rotacionada") return;

        await this.revogarTodasDoUsuario(existente.userId, "reuso");
        const u = await this.users.findOne({ where: { id: existente.userId }, select: { id: true, email: true }, withDeleted: true });
        await this.auditoria.registrarSemFalhar({
            tipo: "SESSAO_REUSO",
            usuario: u ? { id: u.id, email: u.email } : null,
            detalhes: { origem, sessaoId: existente.id },
        });
    }

    /** Logout: revoga a sessao do token informado. Token inexistente/ja revogado e no-op. */
    async revogarPorToken(refreshToken: string, motivo: MotivoRevogacao = "logout"): Promise<void> {
        await this.sessoes.update(
            { tokenHash: sha256Hex(refreshToken), revokedAt: IsNull() },
            { revokedAt: new Date(), revokedReason: motivo },
        );
    }

    /** Id e e-mail do usuario (auditoria). */
    async identificarUsuario(userId: number): Promise<{ id: number; email: string } | null> {
        const u = await this.users.findOne({ where: { id: userId }, select: { id: true, email: true }, withDeleted: true });
        return u ? { id: u.id, email: u.email } : null;
    }

    /** Troca de senha, remocao de usuario ou deteccao de reuso: derruba todas as sessoes. */
    async revogarTodasDoUsuario(userId: number, motivo: MotivoRevogacao): Promise<void> {
        await this.sessoes.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date(), revokedReason: motivo });
    }

    /** Remove sessoes mortas ha mais de 30 dias. */
    @Cron("30 3 * * *")
    async limpar(): Promise<void> {
        try {
            const r = await this.sessoes
                .createQueryBuilder()
                .delete()
                .from(Sessao)
                .where("expires_at < now() - interval '30 days' OR revoked_at < now() - interval '30 days'")
                .execute();
            if (r.affected) this.logger.log(`Sessoes antigas removidas: ${r.affected}`);
        } catch (err) {
            this.logger.warn(`Falha na limpeza de sessoes: ${(err as Error).message}`);
        }
    }
}
