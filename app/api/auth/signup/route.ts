import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { USER_COOKIE, USER_SESSION_MAX_AGE_S, createUserSessionToken } from "@/lib/userAuth";
import { hashPassword } from "@/lib/password";
import { createUser, findUserByEmail } from "@/lib/users";
import { rateLimit } from "@/lib/rate-limit";

/*
 * POST /api/auth/signup — cria a conta do cliente (login obrigatório antes da
 * compra, a pedido do usuário). Sem confirmação por e-mail nesta primeira
 * versão: cadastro simples, focado em não travar o funil de compra.
 */
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`auth-signup:${getClientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "E-mail inválido ou senha muito curta (mínimo 8 caracteres)." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (await findUserByEmail(email)) {
    return NextResponse.json(
      { error: "Este e-mail já tem uma conta. Faça login." },
      { status: 409 },
    );
  }

  const user = await createUser(email, hashPassword(parsed.data.password));
  if (!user) {
    // corrida rara com outra requisição simultânea criando o mesmo e-mail
    return NextResponse.json(
      { error: "Este e-mail já tem uma conta. Faça login." },
      { status: 409 },
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
