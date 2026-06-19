export function credentialsEmailTemplate(
    name: string,
    login: string,
    password: string,
): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Credenciais de Acesso — ATS</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f0f4f0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:48px 16px;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #c8dbd0;">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1b5e3b,#2e7d52);padding:40px 48px;text-align:center;">
                  <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:28px;line-height:56px;display:block;">🔑</span>
                  </div>
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                    Acesso ao Sistema ATS
                  </h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.80);font-size:14px;">
                    Sistema de Acompanhamento do Transporte Sanitário
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px 48px;">
                  <p style="margin:0 0 8px;color:#4a7a5a;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                    Olá,
                  </p>
                  <p style="margin:0 0 28px;color:#2d3f35;font-size:16px;line-height:1.6;">
                    <strong style="color:#1b5e3b;">${name}</strong>, sua conta foi criada no Sistema ATS.
                    Utilize as credenciais abaixo para acessar o sistema.
                  </p>

                  <!-- Credentials Box -->
                  <div style="background:#f0f4f0;border:1px solid #c8dbd0;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
                    <p style="margin:0 0 16px;color:#4a7a5a;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                      Suas credenciais
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #d8e8df;">
                          <span style="color:#4a7a5a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Login</span>
                        </td>
                        <td style="padding:8px 0;border-bottom:1px solid #d8e8df;text-align:right;">
                          <code style="font-size:15px;font-weight:700;color:#1b5e3b;font-family:'Courier New',monospace;">${login}</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#4a7a5a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Senha</span>
                        </td>
                        <td style="padding:8px 0;text-align:right;">
                          <code style="font-size:15px;font-weight:700;color:#1b5e3b;font-family:'Courier New',monospace;">${password}</code>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Warning -->
                  <div style="background:#e8f4ed;border-left:3px solid #1b5e3b;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
                    <p style="margin:0;color:#1b5e3b;font-size:13px;line-height:1.5;">
                      ⚠️ Recomendamos que você altere sua senha no primeiro acesso. Não compartilhe suas credenciais.
                    </p>
                  </div>

                  <p style="margin:0;color:#7a9a85;font-size:13px;line-height:1.6;">
                    Se você não esperava receber este e-mail, entre em contato com o administrador do sistema.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="border-top:1px solid #c8dbd0;padding:24px 48px;text-align:center;">
                  <p style="margin:0;color:#7a9a85;font-size:12px;">
                    © ${new Date().getFullYear()} Ministério da Saúde · DECAN/ATS · Mensagem automática, não responda.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
