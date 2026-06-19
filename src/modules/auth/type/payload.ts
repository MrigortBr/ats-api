import { UserRole } from "../entities/user.entity";

export type login = {
    login: string;
    password: string;
};

export type createUser = {
    email: string;
    name: string;
    surname: string;
    password?: string;
    role: UserRole;
};
