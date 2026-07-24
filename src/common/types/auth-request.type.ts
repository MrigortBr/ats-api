import type { Request } from "express";

/**
 * Extensão do Request do Express com o payload do JWT injetado pelo JwtAuthGuard.
 * Centralizado aqui para evitar redeclaração em cada controller.
 */
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        modules: string[];
        companyId?: number | null;
        roleId?: number | null;
        [key: string]: unknown;
    };
}
