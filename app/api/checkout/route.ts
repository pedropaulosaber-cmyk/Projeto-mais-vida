import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { requireEnv, getEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { PRODUCT_METADATA_VALUE, getPriceCents } from "@/lib/product";

/*
 * POST /api/checkout (skill stripe-drive-checkout, Passo 2).
 *
 * Cria a Stripe Checkout Session server-side e devolve { url } para o
 * frontend redirecionar (window.location = url). O VALOR cobrado é definido no
 * código (lib/product.ts#getPriceCents, com override via env PRICE_CENTS) e
 * montado com price_data, referenciando o PRODUTO existente no Stripe para
 * preservar nome/imagem na tela de pagamento. Assim, mudar o preço é só um
 * deploy — sem criar um novo Price no painel do Stripe.
 */
export const runtime = "nodejs";

/*
 * ID do produto no Stripe. Preferimos STRIPE_PRODUCT_ID (se definido); senão,
 * derivamos do STRIPE_PRICE_ID existente (buscamos o Price uma vez e usamos o
 * produto dele). Cacheado em memória para não repetir a chamada a cada checkout.
 */
let _productIdCache: string | null = null;
async function resolveProductId(stripe: Stripe): Promise<string> {
  const explicit = getEnv("STRIPE_PRODUCT_ID");
  if (explicit) return explicit;
  if (_productIdCache) return _productIdCache;

  const price = await stripe.prices.retrieve(requireEnv("STRIPE_PRICE_ID"));
  const product =
    typeof price.product === "string" ? price.product : price.product.id;
  _productIdCache = product;
  return product;
}

const bodySchema = z.object({
  ctaId: z.string().max(60).optional(),
  // Sinais de tracking (skill conversion-tracking) repassados para o metadata da
  // sessão, para o webhook correlacionar a venda à campanha (UTM) e disparar a
  // Conversions API do Meta com bom match (fbp/fbc).
  sessionId: z.string().max(64).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  fbp: z.string().max(120).optional(),
  fbc: z.string().max(255).optional(),
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

  let tracking: z.infer<typeof bodySchema> = {};
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (parsed.success) tracking = parsed.data;
  } catch {
    // corpo ausente/malformado é aceitável — os campos são metadados opcionais
  }

  const siteUrl = getBaseUrl(req);

  // Nome que aparece na fatura do cartão (skill fraud-prevention, Passo 3).
  // Como a conta Stripe é compartilhada com outro produto, um descritor fixo e
  // reconhecível reduz chargeback do tipo "não reconheço essa cobrança".
  const statementDescriptor = getEnv("STRIPE_STATEMENT_DESCRIPTOR");

  // Só entram no metadata os campos de tracking presentes (Stripe limita chaves
  // e tamanho por valor; omitir vazios mantém enxuto).
  const trackingMetadata: Record<string, string> = {};
  if (tracking.sessionId) trackingMetadata.sid = tracking.sessionId;
  if (tracking.utmSource) trackingMetadata.utm_source = tracking.utmSource;
  if (tracking.utmMedium) trackingMetadata.utm_medium = tracking.utmMedium;
  if (tracking.utmCampaign) trackingMetadata.utm_campaign = tracking.utmCampaign;
  if (tracking.fbp) trackingMetadata.fbp = tracking.fbp;
  if (tracking.fbc) trackingMetadata.fbc = tracking.fbc;

  try {
    const stripe = getStripe();
    const productId = await resolveProductId(stripe);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            product: productId,
            unit_amount: getPriceCents(),
          },
        },
      ],
      success_url: `${siteUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: siteUrl,
      metadata: {
        produto: PRODUCT_METADATA_VALUE,
        cta_id: tracking.ctaId ?? "",
        ...trackingMetadata,
      },
      // A metadata da Checkout Session NÃO é copiada para o PaymentIntent/Charge.
      // Sem isso, o evento charge.dispute.created (webhook) não teria como saber
      // se a disputa é deste produto ou de outro na conta compartilhada.
      payment_intent_data: {
        metadata: { produto: PRODUCT_METADATA_VALUE },
        ...(statementDescriptor
          ? { statement_descriptor: statementDescriptor }
          : {}),
      },
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
