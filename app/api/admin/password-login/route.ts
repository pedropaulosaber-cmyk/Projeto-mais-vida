import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_S,
  createSessionToken,
  isAllowedEmail,
} from "@/lib/adminAuth";
import { verifyPassword } from "@/lib/adminPassword";
import { rateLimit } from "@/lib/rate-limit";

/*
 * POST /api/admin/password-login — login direto por e-mail + senha, a pedido
 * do usuário (quer uma "página exclusiva" sem depender de e-mail ou link).
 * Como é a única barreira (sem 2º fator), o rate limit é bem mais restritivo
 * que o do magic link para dificultar força bruta.
 */
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`admin-pw:${getClientIp(req)}`, 8, 15 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (!isAllowedEmail(email) || !verifyPassword(parsed.data.password)) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSessionToken(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
