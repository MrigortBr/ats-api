import * as nodemailer from "nodemailer";
import { credentialsEmailTemplate } from "./mail.templates";

interface SendCredentialsParams {
    to: string;
    name: string;
    password: string;
}

export async function sendCredentialsEmail({
    to,
    name,
    password,
}: SendCredentialsParams): Promise<void> {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT ?? 587),
        secure: process.env.MAIL_SECURE === "true",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME ?? "Painel de Acompanhamento de Transportes e Equipamentos"}" <${process.env.MAIL_USER}>`,
        to,
        subject: "Suas credenciais de acesso — Painel de Acompanhamento de Transportes e Equipamentos",
        html: credentialsEmailTemplate(name, to, password),
    });
}
