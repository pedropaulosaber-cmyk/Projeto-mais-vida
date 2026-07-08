import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { requireEnv, getEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { PRODUCT_METADATA_VALUE } from "@/lib/product";

/*
 * POST /api/checkout (skill stripe-drive-checkout, Passo 2).
 *
 * Cria a Stripe Checkout Session server-side e devolve { url } para o
 * frontend redirecionar (window.location = url). O preço vem SEMPRE de
 * STRIPE_PRICE_ID — nunca hardcoded aqui nem no client, para não haver dois
 * lugares de verdade sobre quanto custa o produto.
 */
export const runtime = "nodejs";

const bodySchema = z.object({
  ctaId: z.string().max(60).optional(),
});

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

/*
 * URL base para success_url/cancel_url. Derivada da PRÓPRIA requisição (origin/
 * host) para não depender de NEXT_PUBLIC_SITE_URL — que, por ser NEXT_PUBLIC_*,
 * é inlinada em build e "vazava" http://localhost:3000 em produção. Assim
 * funciona em produção, preview e local sem configuração manual.
 */
function getBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return getEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  let ctaId: string | undefined;
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (parsed.success) ctaId = parsed.data.ctaId;
  } catch {
    // corpo ausente/malformado é aceitável — ctaId é só metadado opcional
  }

  const siteUrl = getBaseUrl(req);

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: requireEnv("STRIPE_PRICE_ID"), quantity: 1 }],
      success_url: `${siteUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: siteUrl,
      metadata: { produto: PRODUCT_METADATA_VALUE, cta_id: ctaId ?? "" },
    });

    if (!session.url) {
      throw new Error("Stripe não retornou uma URL de checkout.");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] falha ao criar sessão:", err);
    return NextResponse.json(
      { error: "Não foi possível iniciar o checkout. Tente novamente." },
      { status: 502 },
    );
  }
}
