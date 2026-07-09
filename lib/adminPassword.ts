/*
 * Login por e-mail + senha do painel admin (alternativa ao magic link, a
 * pedido do usuário: quer digitar e-mail/senha direto em /admin, sem depender
 * de e-mail ou de um link secreto). Roda só no runtime Node (rota de login),
 * nunca no middleware edge — por isso fica separado de lib/adminAuth.ts.
 *
 * A senha nunca é guardada em texto puro: só o hash (scrypt + salt) vai para
 * ADMIN_PASSWORD_HASH, no formato "salt:hash" (hex).
 */
import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { requireEnv } from "./env";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string): boolean {
  const stored = requireEnv("ADMIN_PASSWORD_HASH");
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
