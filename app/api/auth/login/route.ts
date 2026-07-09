import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { USER_COOKIE, USER_SESSION_MAX_AGE_S, createUserSessionToken } from "@/lib/userAuth";
import { verifyPasswordHash } from "@/lib/password";
import { findUserByEmail } from "@/lib/users";
import { rateLimit } from "@/lib/rate-limit";

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
  const limit = rateLimit(`auth-login:${getClientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await findUserByEmail(email);

  if (!user || !verifyPasswordHash(parsed.data.password, user.passwordHash)) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, await createUserSessionToken(email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE_S,
  });
  return res;
}
