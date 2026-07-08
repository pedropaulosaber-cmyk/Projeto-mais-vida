import { NextResponse } from "next/server";

/*
 * POST /api/checkout — ESQUELETO (Etapa 1).
 *
 * Responsabilidade (skill stripe-drive-checkout, Passo 2): criar a Stripe
 * Checkout Session server-side e devolver { url } para o frontend redirecionar.
 * O preço vem SEMPRE de STRIPE_PRICE_ID (nunca hardcoded no client nem em dois
 * lugares). A implementação real (mode: "payment", line_items com o Price,
 * success_url/cancel_url, metadata) entra na etapa de checkout, junto com:
 *   - rate limiting (lib/rate-limit.ts) para conter abuso
 *   - Stripe Radar / fraud-prevention na configuração da conta/checkout
 *
 * Roda no runtime Node (precisa do SDK do Stripe com a secret key).
 */
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Não implementado — esqueleto (Etapa 1)." },
    { status: 501 },
  );
}
