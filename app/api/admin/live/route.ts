import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import { getLiveVisitorsCount, getRecentEvents } from "@/lib/adminMetrics";
import { rateLimit } from "@/lib/rate-limit";

/*
 * GET /api/admin/live — alimenta a Central de eventos do painel (contador de
 * visitantes agora + feed dos últimos eventos), consultado por polling do
 * client a cada poucos segundos. Protegido por sessão de admin — não passa
 * pelo middleware (que só cobre /admin), então verificamos aqui.
 */
export const runtime = "nodejs";

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`admin-live:${getClientIp(req)}`, 40, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const [liveVisitors, events] = await Promise.all([
    getLiveVisitorsCount(),
    getRecentEvents(40),
  ]);

  return NextResponse.json({ liveVisitors, events });
}
