import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  createSessionToken,
  verifyMagicToken,
} from "@/lib/adminAuth";

/*
 * GET /api/admin/verify?token=... — valida o magic link e, se ok, troca por um
 * cookie de sessão assinado (httpOnly) e redireciona para o painel.
 */
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = token ? await verifyMagicToken(token) : null;

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  if (!payload) {
    loginUrl.search = "?erro=link";
    return NextResponse.redirect(loginUrl);
  }

  const adminUrl = req.nextUrl.clone();
  adminUrl.pathname = "/admin";
  adminUrl.search = "";

  const res = NextResponse.redirect(adminUrl);
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(payload.email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
