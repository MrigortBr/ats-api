import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import { InvalidCredentialsException } from "./exceptions/invalid.exception";
import { UserAlreadyExistsException } from "./exceptions/userAlready.exception";
import * as payload from "./type/payload";
import { generatePassword, generateLogin } from "../../common/utils/generate-credentials";
import { sendCredentialsEmail } from "../../common/mail/mail.service";

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

        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            access_token: token,
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role,
            },
        };
    }

    async refresh(user: { id: number; email: string; role: string }) {
        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return { access_token: token };
    }

    async createUser(data: payload.createUser) {
        const existing = await this.authRepository.findByEmail(data.email);
        if (existing) throw new UserAlreadyExistsException();

        // Se nao veio senha, gera automaticamente: NomeSobrenome + 3 digitos
        const plainPassword = data.password && data.password.trim()
            ? data.password
            : generatePassword(data.name, data.surname);

        const login = generateLogin(data.name, data.surname);

        const hashedPassword = await bcrypt.hash(
            plainPassword,
            Number(process.env.HASH_AMOUNT) || 12,
        );

        await this.authRepository.create({
            name: data.name,
            surname: data.surname,
            email: data.email,
            password: hashedPassword,
            role: data.role,
        });

        // Envia credenciais por e-mail (nao bloqueia em caso de falha)
        if (process.env.MAIL_USER) {
            sendCredentialsEmail({
                to: data.email,
                name: data.name + " " + data.surname,
                password: plainPassword,
            }).catch((err) =>
                console.warn("[mail] Falha ao enviar credenciais:", err && err.message),
            );
        }

        return {
            message: "Usuario cadastrado com sucesso",
            login,
            passwordGenerated: !(data.password && data.password.trim()),
        };
    }
}
