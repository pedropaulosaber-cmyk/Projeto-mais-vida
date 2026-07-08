/*
 * E-mail transacional de entrega (skill stripe-drive-checkout, Passo 4).
 *
 * Disparado pelo webhook LOGO após o pagamento ser confirmado — nunca manual,
 * nunca atrasado. Contém: confirmação da compra, valor pago, instruções de
 * acesso ao Drive (o comprador já recebe o convite do Google por e-mail via
 * lib/drive.ts; aqui reforçamos o passo a passo) e contato de suporte.
 *
 * Automações adicionais (carrinho abandonado, boas-vindas, upsell) entram na
 * etapa da skill email-automation — este módulo cuida só do transacional.
 */
import "server-only";
import { Resend } from "resend";
import { requireEnv, getEnv } from "./env";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(requireEnv("EMAIL_API_KEY"));
  }
  return _resend;
}

export interface DeliveryEmailInput {
  to: string;
  amountPaidFormatted: string; // ex: "R$ 39,90"
}

export async function sendDeliveryEmail({
  to,
  amountPaidFormatted,
}: DeliveryEmailInput): Promise<void> {
  const from = requireEnv("EMAIL_FROM");
  const supportEmail = getEnv("SUPPORT_EMAIL") ?? from;

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A1A;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">Sua compra foi confirmada! 🎉</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #4b4b4b;">
        Recebemos a confirmação do seu pagamento de <strong>${amountPaidFormatted}</strong>.
        O acesso à biblioteca já foi liberado para este e-mail (<strong>${to}</strong>)
        na pasta do Google Drive.
      </p>
      <div style="background:#FFF6D6; border:1px solid #FCE9A8; border-radius:12px; padding:16px; margin:20px 0;">
        <p style="font-size: 14px; line-height: 1.6; margin: 0;">
          <strong>Como acessar:</strong><br>
          Você deve ter recebido (ou vai receber em instantes) um e-mail do
          Google Drive convidando este endereço para a pasta compartilhada.
          Basta abrir o convite e acessar — se o Google pedir login, use este
          mesmo e-mail (<strong>${to}</strong>).
        </p>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #6b7280;">
        Precisa de ajuda? Fale com a gente em
        <a href="mailto:${supportEmail}" style="color:#1A1A1A;">${supportEmail}</a>.
      </p>
    </div>
  `.trim();

  await getResend().emails.send({
    from,
    to,
    subject: "Seu acesso foi liberado — compra confirmada",
    html,
  });
}
