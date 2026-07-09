/*
 * Login por e-mail + senha do painel admin (alternativa ao magic link, a
 * pedido do usuário: quer digitar e-mail/senha direto em /admin, sem depender
 * de e-mail ou de um link secreto). Roda só no runtime Node (rota de login),
 * nunca no middleware edge — por isso fica separado de lib/adminAuth.ts.
 *
 * A senha nunca é guardada em texto puro: só o hash (scrypt + salt) vai para
 * ADMIN_PASSWORD_HASH — ver lib/password.ts.
 */
import "server-only";
import { requireEnv } from "./env";
import { verifyPasswordHash } from "./password";

export { hashPassword } from "./password";

export function verifyPassword(password: string): boolean {
  return verifyPasswordHash(password, requireEnv("ADMIN_PASSWORD_HASH"));
}
