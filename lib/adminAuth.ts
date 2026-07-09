/*
 * Autenticação do painel admin (prompt §9 — "trate a segurança com prioridade
 * máxima"). Login por MAGIC LINK: sem senha compartilhada que possa vazar.
 *
 * Tokens são assinados com HMAC-SHA256 (Web Crypto, funciona no middleware edge
 * e no runtime node) usando ADMIN_SESSION_SECRET. São stateless — não precisam
 * de tabela: o payload leva a expiração e vai assinado.
 *   - token "magic": enviado por e-mail, validade curta (15 min), 1 finalidade.
 *   - cookie "session": setado após o magic link ser validado, validade 7 dias.
 */
import { requireEnv } from "./env";

export const ADMIN_COOKIE = "dbk_admin";
const MAGIC_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPayload {
  email: string;
  purpose: "magic" | "session";
  exp: number;
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

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(requireEnv("ADMIN_SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return b64url(new Uint8Array(sig));
}

async function signToken(payload: TokenPayload): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

async function verifyToken(
  token: string,
  purpose: TokenPayload["purpose"],
): Promise<TokenPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(sig, await hmac(body))) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromB64url(body)),
    ) as TokenPayload;
    if (payload.purpose !== purpose) return null;
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/*
 * Link direto (menos seguro que o magic link): uma chave estática, sem
 * expiração, guardada em ADMIN_DIRECT_LINK_SECRET. Quem tiver o link inteiro
 * entra direto no painel, sem passar pelo e-mail. Existe por conveniência —
 * o magic link continua disponível e é a opção mais segura.
 */
export function verifyDirectLinkSecret(key: string): boolean {
  const secret = getEnvSafe("ADMIN_DIRECT_LINK_SECRET");
  if (!secret || !key) return false;
  return safeEqual(key, secret);
}

function getEnvSafe(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function isAllowedEmail(email: string): boolean {
  const allowed = (requireEnv("ADMIN_ALLOWED_EMAILS") || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export function createMagicToken(email: string): Promise<string> {
  return signToken({
    email: email.trim().toLowerCase(),
    purpose: "magic",
    exp: Date.now() + MAGIC_TTL_MS,
  });
}

export function verifyMagicToken(token: string): Promise<TokenPayload | null> {
  return verifyToken(token, "magic");
}

export function createSessionToken(email: string): Promise<string> {
  return signToken({ email, purpose: "session", exp: Date.now() + SESSION_TTL_MS });
}

export function verifySessionToken(token: string): Promise<TokenPayload | null> {
  return verifyToken(token, "session");
}

export const SESSION_MAX_AGE_S = SESSION_TTL_MS / 1000;
