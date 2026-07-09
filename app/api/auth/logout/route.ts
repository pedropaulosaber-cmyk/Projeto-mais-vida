import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/userAuth";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
