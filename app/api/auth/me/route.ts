import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE, verifyUserSessionToken } from "@/lib/userAuth";

/* GET /api/auth/me — usado pelo client para saber se o visitante já está logado. */
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  const session = token ? await verifyUserSessionToken(token) : null;

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, email: session.email });
}
