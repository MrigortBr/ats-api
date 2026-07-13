import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host:   process.env.SMTP_HOST,
            port:   Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendWelcome(opts: {
        to:          string;
        firstName:   string;
        companyName: string;
        password:    string;
    }): Promise<void> {
        const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

        try {
            await this.transporter.sendMail({
                from,
                to:      opts.to,
                subject: `Bem-vindo ao ATS — ${opts.companyName}`,
                html:    buildWelcomeHtml(opts),
                text:    buildWelcomeText(opts),
            });
        } catch (err) {
            // Não bloqueia a criação do usuário — apenas loga o erro.
            this.logger.error(`Falha ao enviar e-mail para ${opts.to}: ${String(err)}`);
        }
    }
}

// ── Templates ─────────────────────────────────────────────────────────────────

function buildWelcomeText({ firstName, companyName, to, password }: {
    firstName: string; companyName: string; to: string; password: string;
}): string {
    return [
        `Olá, ${firstName}!`,
        ``,
        `Seu acesso ao ATS foi criado para a empresa ${companyName}.`,
        ``,
        `E-mail:  ${to}`,
        `Senha:   ${password}`,
        ``,
        `Recomendamos que você altere sua senha no primeiro acesso.`,
    ].join("\n");
}

function buildWelcomeHtml({ firstName, companyName, to, password }: {
    firstName: string; companyName: string; to: string; password: string;
}): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao ATS</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1b5e3b;padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-.3px;">ATS</p>
              <p style="margin:4px 0 0;color:#86efac;font-size:13px;">Acompanhamento do Transporte Sanitário</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1a2e20;">Olá, ${firstName}!</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7b6e;line-height:1.6;">
                Seu acesso ao ATS foi criado para a empresa <strong>${companyName}</strong>.
                Use as credenciais abaixo para fazer seu primeiro login.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#4a7c5f;">Suas credenciais</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#6b7b6e;padding-right:16px;padding-bottom:6px;white-space:nowrap;">E-mail</td>
                        <td style="font-size:13px;color:#1a2e20;font-weight:600;padding-bottom:6px;">${to}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#6b7b6e;padding-right:16px;white-space:nowrap;">Senha inicial</td>
                        <td style="font-size:15px;color:#166534;font-weight:700;font-family:monospace;letter-spacing:.04em;">${password}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9aab9e;line-height:1.5;">
                Por segurança, recomendamos alterar sua senha no primeiro acesso.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f9f6;padding:16px 32px;border-top:1px solid #e4ebe6;">
              <p style="margin:0;font-size:11px;color:#9aab9e;">
                Esta mensagem foi gerada automaticamente pelo sistema ATS. Não responda este e-mail.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
