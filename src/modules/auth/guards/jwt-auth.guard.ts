import {
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { isObservable, lastValueFrom } from "rxjs";
import { SKIP_CSRF_KEY } from "../decorators/skip-csrf.decorator";
import { checkCsrf } from "./csrf";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
    private readonly logger = new Logger("Csrf");

    constructor(private readonly reflector: Reflector) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const result = super.canActivate(context);
        const allowed = isObservable(result) ? await lastValueFrom(result) : await result;
        if (!allowed) return false;

        const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!skip) {
            // CSRF_ENFORCE=true bloqueia (403); sem ela so registra no log (rollout gradual).
            checkCsrf(context.switchToHttp().getRequest<Request>(), {
                enforce: process.env.CSRF_ENFORCE === "true",
                onViolation: (msg) => this.logger.warn(`[modo log] ${msg}`),
            });
        }
        return true;
    }

    handleRequest<TUser>(err: Error, user: TUser): TUser {
        if (err || !user) {
            throw new UnauthorizedException("Token invalido ou expirado");
        }

        return user;
    }
}
