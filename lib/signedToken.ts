/*
 * Tokens assinados (HMAC-SHA256, Web Crypto — funciona no middleware edge e no
 * runtime node) genéricos, usados tanto pela sessão do admin (lib/adminAuth.ts)
 * quanto pela sessão de clientes (lib/userAuth.ts). Stateless: o payload leva a
 * expiração e vai assinado, sem precisar de tabela de sessões.
 */

export interface SignedPayload {
  purpose: string;
  exp: number;
  [key: string]: unknown;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

export async function signToken(
  payload: SignedPayload,
  secret: string,
): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body, secret)}`;
}

export async function verifyToken<T extends SignedPayload>(
  token: string,
  secret: string,
  purpose: string,
): Promise<T | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(sig, await hmac(body, secret))) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as T;
    if (payload.purpose !== purpose) return null;
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
