import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  createSessionToken,
  verifyDirectLinkSecret,
} from "@/lib/adminAuth";
import { requireEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

/*
 * GET /api/admin/direct?chave=... — login direto por link secreto fixo
 * (alternativa ao magic link, a pedido do usuário: "link exclusivo, com
 * login, pra cair direto no dashboard"). Menos seguro que o magic link
 * porque a chave não expira sozinha — se o link vazar, quem tiver acesso
 * a ele entra no painel até a chave ser trocada em ADMIN_DIRECT_LINK_SECRET.
 * Rate-limited por IP para dificultar tentativa por força bruta.
 */
export const runtime = "nodejs";

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function GET(req: NextRequest) {
  const limit = rateLimit(`admin-direct:${getClientIp(req)}`, 10, 60_000);

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  if (!limit.ok) {
    loginUrl.search = "?erro=tentativas";
    return NextResponse.redirect(loginUrl);
  }

  const key = req.nextUrl.searchParams.get("chave") ?? "";
  if (!verifyDirectLinkSecret(key)) {
    loginUrl.search = "?erro=link";
    return NextResponse.redirect(loginUrl);
  }

  const email = requireEnv("ADMIN_ALLOWED_EMAILS")
    .split(",")[0]
    .trim()
    .toLowerCase();

  const adminUrl = req.nextUrl.clone();
  adminUrl.pathname = "/admin";
  adminUrl.search = "";

  const res = NextResponse.redirect(adminUrl);
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
