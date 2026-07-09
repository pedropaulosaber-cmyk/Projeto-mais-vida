/*
 * Meta Conversions API — evento de compra SERVER-SIDE (skill conversion-tracking,
 * Passo 4). Disparado no webhook, após o pagamento ser confirmado. É mais
 * confiável que o Pixel do navegador (não é bloqueado por ad-blocker e funciona
 * mesmo se o comprador fechar a aba).
 *
 * Deduplicação: usamos o `stripe_session_id` como `event_id`. Como o Purchase é
 * enviado APENAS por aqui (nunca no client), o event_id serve para o Meta ignorar
 * reenvios do mesmo webhook, não para deduplicar contra um evento de browser.
 */
import "server-only";
import crypto from "crypto";
import { getEnv } from "./env";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface MetaPurchaseInput {
  eventId: string;
  email?: string | null;
  valueCents: number;
  currency: string; // ex: "brl"
  fbp?: string | null;
  fbc?: string | null;
  eventSourceUrl?: string | null;
}

/** Envia o evento Purchase para a Conversions API. No-op se o tracking do Meta
 *  não estiver configurado (não é erro — apenas significa que está desligado). */
export async function sendMetaPurchase(input: MetaPurchaseInput): Promise<void> {
  const pixelId = getEnv("NEXT_PUBLIC_META_PIXEL_ID");
  const token = getEnv("META_CONVERSIONS_API_TOKEN");
  if (!pixelId || !token) return;

  const userData: Record<string, unknown> = {};
  if (input.email) userData.em = [sha256(input.email)];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: {
          currency: input.currency.toUpperCase(),
          value: input.valueCents / 100,
        },
      },
    ],
  };

  const testCode = getEnv("META_TEST_EVENT_CODE");
  if (testCode) body.test_event_code = testCode;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta CAPI ${res.status}: ${text.slice(0, 300)}`);
  }
}
