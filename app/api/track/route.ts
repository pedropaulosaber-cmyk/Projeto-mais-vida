import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordEvent } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/*
 * POST /api/track — registra eventos do funil vindos do client (page_view,
 * view_item, begin_checkout, cta_click) na tabela `events`, para o painel admin
 * (prompt §9) consultar sem depender de nenhuma plataforma externa.
 *
 * NÃO aceita o evento `purchase`: compra só é registrada server-side, no webhook,
 * a partir da confirmação real do pagamento (skill conversion-tracking, princípio
 * central) — senão qualquer visitante poderia forjar uma "venda".
 */
export const runtime = "nodejs";

const bodySchema = z.object({
  type: z.enum([
    "page_view",
    "view_item",
    "begin_checkout",
    "cta_click",
    "time_on_page",
    "heartbeat",
  ]),
  sessionId: z.string().max(64).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  path: z.string().max(200).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`track:${getClientIp(req)}`, 60, 60_000);
  if (!limit.ok) return new NextResponse(null, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { type, sessionId, utmSource, utmMedium, utmCampaign, path, meta } =
    parsed.data;

  await recordEvent(type, {
    sessionId,
    utmSource,
    utmMedium,
    utmCampaign,
    path,
    ...(meta ?? {}),
  }).catch((err) => {
    console.error("[track] falha ao registrar evento:", err);
  });

  return new NextResponse(null, { status: 204 });
}
