import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createMagicToken, isAllowedEmail } from "@/lib/adminAuth";
import { sendAdminLoginEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

/*
 * POST /api/admin/login — recebe um e-mail e, SE ele estiver em
 * ADMIN_ALLOWED_EMAILS, envia um magic link. Responde sempre 200 (mesmo para
 * e-mail não autorizado) para não revelar quais e-mails têm acesso.
 */
export const runtime = "nodejs";

const bodySchema = z.object({ email: z.string().email().max(200) });

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

function getBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`admin-login:${getClientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  if (isAllowedEmail(email)) {
    try {
      const token = await createMagicToken(email);
      const url = `${getBaseUrl(req)}/api/admin/verify?token=${encodeURIComponent(token)}`;
      await sendAdminLoginEmail(email, url);
    } catch (err) {
      console.error("[admin-login] falha ao enviar magic link:", err);
      // Não vaza o motivo — resposta genérica abaixo.
    }
  }

  return NextResponse.json({ ok: true });
}
