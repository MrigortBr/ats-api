import { v4 as uuidv4 } from "uuid";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import { InvalidCredentialsException } from "./exceptions/invalid.exception";
import * as payload from "./type/payload";

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService,
    ) {}

    async login(data: payload.login) {
        const user = await this.authRepository.findByEmail(data.login);

        if (!user) throw new InvalidCredentialsException();

        const passwordMatch = await bcrypt.compare(data.password, user.password);
        if (!passwordMatch) throw new InvalidCredentialsException();

        // Resolve módulos efetivos: role.roleModules ∪ modulesOverride
        const roleModules: string[] = user.roleEntity?.roleModules?.map((rm) => rm.module) ?? [];
        const overrides: string[]   = user.modulesOverride ?? [];
        const modules = [...new Set([...roleModules, ...overrides])];
        const writeModules: string[] = user.roleEntity?.roleModules?.filter((rm) => rm.canWrite).map((rm) => rm.module) ?? [];

        const jti = uuidv4();
        const token = this.jwtService.sign({
            jti,
            sub:       user.id,
            email:     user.email,
            /** RBAC */
            roleId:    user.roleId,
            modules,
            writeModules,
            companyId: user.companyId,
        });

        return {
            access_token: token,
            user: {
                id:        user.id,
                name:      user.name,
                surname:   user.surname,
                email:     user.email,
                /** RBAC */
                roleId:    user.roleId,
                modules,
                writeModules,
                companyId: user.companyId,
            },
        };
    }

    async refresh(user: {
        id: number;
        email: string;
        roleId?: number | null;
        modules?: string[];
        companyId?: number | null;
    }) {
        // Re-lê o usuário para pegar módulos atualizados (ex: admin mudou permissões)
        const dbUser = await this.authRepository.findById(user.id);
        const roleModules: string[] = dbUser?.roleEntity?.roleModules?.map((rm) => rm.module) ?? [];
        const overrides: string[]   = dbUser?.modulesOverride ?? [];
        const modules = [...new Set([...roleModules, ...overrides])];
        const writeModules: string[] = dbUser?.roleEntity?.roleModules?.filter((rm) => rm.canWrite).map((rm) => rm.module) ?? [];

        const token = this.jwtService.sign({
            jti:       uuidv4(),
            sub:       user.id,
            email:     user.email,
            roleId:    dbUser?.roleId ?? user.roleId,
            modules,
            writeModules,
            companyId: dbUser?.companyId ?? user.companyId,
        });
        return { access_token: token };
    }
}
