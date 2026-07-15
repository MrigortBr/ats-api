import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { credentialsEmailTemplate, credentialsTextTemplate } from "../../common/mail/mail.templates";

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host:   process.env.MAIL_HOST   ?? process.env.SMTP_HOST,
            port:   Number(process.env.MAIL_PORT   ?? process.env.SMTP_PORT   ?? 587),
            secure: (process.env.MAIL_SECURE ?? process.env.SMTP_SECURE) === "true",
            auth: {
                user: process.env.MAIL_USER ?? process.env.SMTP_USER,
                pass: process.env.MAIL_PASS ?? process.env.SMTP_PASS,
            },
        });
    }

    async sendWelcome(opts: {
        to:          string;
        firstName:   string;
        companyName: string;
        password:    string;
    }): Promise<void> {
        const from = process.env.MAIL_FROM_NAME
            ? `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER ?? process.env.SMTP_USER}>`
            : (process.env.SMTP_FROM ?? process.env.MAIL_USER ?? process.env.SMTP_USER);

        try {
            await this.transporter.sendMail({
                from,
                to:      opts.to,
                subject: `Bem-vindo ao Painel de acompanhamento - ${opts.companyName}`,
                html:    credentialsEmailTemplate(opts.firstName, opts.to, opts.password, opts.companyName),
                text:    credentialsTextTemplate(opts.firstName, opts.to, opts.password, opts.companyName),
            });
        } catch (err) {
            this.logger.error(`Falha ao enviar e-mail de boas-vindas para ${opts.to}: ${String(err)}`);
            if (process.env.SEND_EMAIL === "true") throw err;
        }
    }
}