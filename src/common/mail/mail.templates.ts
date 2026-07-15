export function credentialsEmailTemplate(
    name: string,
    email: string,
    password: string,
    companyName?: string,
): string {
    void email; // email é usado no subject/to, não exibido no corpo

    const companyLine = companyName
        ? `para a empresa <strong style="color:#1b5e3b;">${companyName}</strong>`
        : "no Painel de Acompanhamento de Transportes e Equipamentos";

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Credenciais de Acesso - Painel de Acompanhamento de Transportes e Equipamentos</title>
</head>
<body style="margin:0;padding:0;background:#eef4ef;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef4ef;padding:48px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td bgcolor="#1b5e3b" style="background-color:#1b5e3b;padding:44px 48px 36px;text-align:center;">
          <p style="margin:0 0 8px;font-size:34px;line-height:1;">&#128273;</p>
          <p style="margin:0 0 4px;color:#fff;font-size:22px;font-weight:700;">Bem-vindo(a)</p>
          <p style="margin:0;color:#a8d5bc;font-size:13px;">Painel de Acompanhamento de Transportes e Equipamentos - DECAN/MS</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 48px 32px;">
          <p style="margin:0 0 24px;color:#2d3f35;font-size:15px;line-height:1.6;">
            Ola, <strong style="color:#1b5e3b;">${name}</strong>! Sua conta foi criada ${companyLine}. Use as credenciais abaixo para acessar.
          </p>

          <!-- Credentials box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8f5;border:1px solid #c8dbd0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:16px 24px 0;">
              <p style="margin:0 0 4px;color:#6b8c78;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Suas credenciais de acesso</p>
              <p style="margin:0 0 16px;color:#a0b8a8;font-size:11px;">Seu login e o seu e-mail institucional</p>
            </td></tr>
            <tr><td style="padding:0 24px 20px;">

              <!-- Senha em destaque -->
              <p style="margin:0 0 8px;color:#6b8c78;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Senha</p>
              <div style="background:#1b5e3b;border-radius:10px;padding:18px 24px;text-align:center;">
                <code style="font-size:26px;font-weight:700;color:#ffffff;font-family:'Courier New',monospace;letter-spacing:4px;">${password}</code>
              </div>
              <p style="margin:8px 0 0;color:#a0b8a8;font-size:11px;text-align:center;">Gerada automaticamente &mdash; altere no primeiro acesso</p>

            </td></tr>
          </table>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="https://ats-rust.vercel.app/" target="_blank"
                 style="display:inline-block;background:#1b5e3b;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.3px;">
                Acessar o Sistema ATS &rarr;
              </a>
            </td></tr>
          </table>

          <!-- Warning -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbea;border:1px solid #f0d060;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:14px 16px;">
              <p style="margin:0;color:#7a5c00;font-size:13px;line-height:1.5;">
                &#9888; <strong>Nao compartilhe suas credenciais.</strong> Em caso de duvidas, contate o administrador do sistema.
              </p>
            </td></tr>
          </table>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f4f8f5;border-top:1px solid #c8dbd0;padding:20px 48px;text-align:center;">
          <p style="margin:0;color:#8faa98;font-size:11px;">
            &copy; ${new Date().getFullYear()} Ministerio da Saude &middot; DECAN &middot; Mensagem automatica, nao responda.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function credentialsTextTemplate(
    name: string,
    email: string,
    password: string,
    companyName?: string,
): string {
    const company = companyName ?? "Painel de Acompanhamento de Transportes e Equipamentos";
    return [
        `Ola, ${name}!`,
        ``,
        `Sua conta foi criada no ${company}.`,
        ``,
        `E-mail:  ${email}`,
        `Senha:   ${password}`,
        ``,
        `Recomendamos que voce altere sua senha no primeiro acesso.`,
        ``,
        `Acesse: https://ats-rust.vercel.app/`,
    ].join("\n");
}
