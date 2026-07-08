/*
 * Acesso a dados — ESQUELETO (Etapa 1).
 *
 * Responsabilidades:
 *   - Registrar VENDAS confirmadas (idempotência por stripe_session_id) — usado
 *     pelo webhook e exibido no painel admin (prompt §9).
 *   - Registrar EVENTOS do funil (page_view, begin_checkout, cta_click, purchase)
 *     para o painel admin consultar sem depender só do GA4 (skill conversion-tracking).
 *
 * Decisão de arquitetura sugerida (a validar): Postgres gerenciado — Supabase ou
 * Vercel Postgres — via DATABASE_URL. Esquema inicial proposto:
 *
 *   sales(id, stripe_session_id UNIQUE, buyer_email, amount_cents, currency,
 *         status, created_at)
 *   events(id, type, session_id, utm_source, utm_medium, utm_campaign,
 *          path, meta JSONB, created_at)
 *
 * A conexão/queries reais entram na etapa do painel admin — mantido como stub.
 */
import "server-only";
import { requireEnv } from "./env";

export function getDatabaseUrl(): string {
  return requireEnv("DATABASE_URL");
}

export interface SaleRecord {
  stripeSessionId: string;
  buyerEmail: string;
  amountCents: number;
  currency: string;
}

// Idempotente por stripeSessionId (o Stripe pode reenviar o mesmo evento).
export async function recordSaleIdempotent(_sale: SaleRecord): Promise<void> {
  throw new Error("Não implementado — esqueleto (Etapa 1).");
}

export async function recordEvent(
  _type: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  throw new Error("Não implementado — esqueleto (Etapa 1).");
}
