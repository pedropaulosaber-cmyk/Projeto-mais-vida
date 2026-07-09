/*
 * Hash de senha genérico (scrypt + salt, `crypto` nativo do Node). Usado tanto
 * pela senha do admin (lib/adminPassword.ts) quanto pela conta de clientes
 * (lib/userAuth.ts) — a senha em si NUNCA é guardada em texto puro, só este hash.
 */
import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * @param stored formato "salt:hash" (hex). `.trim()` tolera espaço/quebra de
 * linha acidental ao colar o valor em algum lugar (ex: variável de ambiente).
 */
export function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.trim().split(":").map((part) => part.trim());
  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
