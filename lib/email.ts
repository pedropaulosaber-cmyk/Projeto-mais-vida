/*
 * Envio de e-mail — ESQUELETO (Etapa 1).
 *
 * Dois papéis:
 *   1. Transacional (skill stripe-drive-checkout, Passo 4): e-mail de ENTREGA
 *      instantâneo disparado no webhook após pagamento confirmado — confirmação
 *      da compra, valor pago, instruções/link de acesso ao Drive, contato de suporte.
 *   2. Automações (skill email-automation): carrinho abandonado, boas-vindas, upsell.
 *
 * Provedor via EMAIL_API_KEY (Resend/SendGrid/Postmark). Implementação real entra
 * nas etapas correspondentes — mantido como stub.
 */
import "server-only";
import { requireEnv } from "./env";

export function getEmailApiKey(): string {
  return requireEnv("EMAIL_API_KEY");
}

export interface DeliveryEmailInput {
  to: string;
  amountPaid: string; // ex: "R$ 39,90"
  accessInstructions: string;
}

export async function sendDeliveryEmail(_input: DeliveryEmailInput): Promise<void> {
  throw new Error("Não implementado — esqueleto (Etapa 1).");
}
