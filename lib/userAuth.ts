/*
 * Sessão de CLIENTE (comprador) — separada da sessão de admin (cookie e
 * segredo diferentes) para não misturar os dois domínios de privilégio.
 * Login obrigatório antes da compra, a pedido do usuário.
 */
import { requireEnv } from "./env";
import { signToken, verifyToken, type SignedPayload } from "./signedToken";

export const USER_COOKIE = "dbk_user";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
export const USER_SESSION_MAX_AGE_S = SESSION_TTL_MS / 1000;

interface UserSessionPayload extends SignedPayload {
  purpose: "user_session";
  email: string;
}

function secret(): string {
  return requireEnv("USER_SESSION_SECRET");
}

export function createUserSessionToken(email: string): Promise<string> {
  return signToken(
    {
      email: email.trim().toLowerCase(),
      purpose: "user_session",
      exp: Date.now() + SESSION_TTL_MS,
    },
    secret(),
  );
}

export function verifyUserSessionToken(
  token: string,
): Promise<UserSessionPayload | null> {
  return verifyToken<UserSessionPayload>(token, secret(), "user_session");
}
