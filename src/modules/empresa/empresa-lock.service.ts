import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Cron } from "@nestjs/schedule";
import { ConflictException } from "@nestjs/common";
import { ComboConsult } from "../hospital/entities/combo-consult.entity";

/** TTL do lock deedicao em minutos. Deve casar com LOCK_TTL_SECS no frontend. */
export const LOCK_TTL_MINUTES = 5;

@Injectable()
export class EmpresaLockService {
    private readonly logger = new Logger(EmpresaLockService.name);

    constructor(
        @InjectRepository(ComboConsult)
        private readonly consultRepo: Repository<ComboConsult>,
    ) {}

    async lockEquipamento(id: number, userEmail: string): Promise<{ lockedBy: string; lockedAt: Date }> {
        const consult = await this.consultRepo.findOne({ where: { id } });
        if (!consult) throw new NotFoundException(`Registro ${id} nao encontrado`);

        const now = new Date();

        if (consult.lockedBy && consult.lockedBy !== userEmail) {
            throw new ConflictException({
                message: `Linha em edicao por ${consult.lockedBy}`,
                lockedBy: consult.lockedBy,
                lockedAt: consult.lockedAt,
            });
        }

        consult.lockedBy = userEmail;
        consult.lockedAt = now;
        await this.consultRepo.save(consult);
        return { lockedBy: userEmail, lockedAt: now };
    }

    async unlockEquipamento(id: number, userEmail: string): Promise<void> {
        const consult = await this.consultRepo.findOne({ where: { id } });
        if (!consult) return;
        if (consult.lockedBy === userEmail) {
            consult.lockedBy = null;
            consult.lockedAt = null;
            await this.consultRepo.save(consult);
        }
    }

    /** Libera locks expirados a cada minuto. TTL = LOCK_TTL_MINUTES. */
    @Cron("* * * * *")
    async releaseExpiredLocks(): Promise<void> {
        const cutoff = new Date(Date.now() - LOCK_TTL_MINUTES * 60 * 1_000);
        const result = await this.consultRepo.update(
            { lockedAt: LessThan(cutoff) },
            { lockedBy: null, lockedAt: null },
        );
        if (result.affected && result.affected > 0) {
            this.logger.log(`[Lock] ${result.affected} lock(s) expirado(s) liberado(s)`);
        }
    }
}
