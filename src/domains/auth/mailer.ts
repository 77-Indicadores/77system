import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) throw new Error("SMTP_HOST não configurado");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.SMTP_FROM ?? `"77System" <noreply@77system.local>`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: "Recuperação de senha — 77System",
    text: `Você solicitou a recuperação de senha.\n\nAcesse o link abaixo para definir uma nova senha (válido por 1 hora):\n${resetUrl}\n\nSe não foi você, ignore este e-mail.`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f3f6;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden">
        <tr>
          <td style="background:#0B0D13;padding:24px 32px">
            <span style="font-size:28px;font-weight:900;letter-spacing:-0.04em;color:#fff">7<span style="color:#C8102E">7</span></span>
            <span style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#555C78;margin-top:4px">Sistema Analítico</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0f172a">Recuperação de senha</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6">
              Recebemos uma solicitação para redefinir a senha desta conta.<br>
              Clique no botão abaixo para continuar. O link expira em <strong>1 hora</strong>.
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#C8102E;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:7px;text-decoration:none">
              Redefinir senha
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">
              Se não foi você, ignore este e-mail — sua senha permanece a mesma.<br>
              Ou copie o link: <span style="word-break:break-all">${resetUrl}</span>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
