import { SetMetadata } from "@nestjs/common";

export const SKIP_CSRF_KEY = "skipCsrf";

/**
 * Isenta o endpoint da checagem de CSRF feita pelo JwtAuthGuard.
 * Use apenas onde ainda nao existe token no front (ex.: POST /auth/refresh no
 * primeiro carregamento da pagina) e onde um disparo forjado nao vaza dados.
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
