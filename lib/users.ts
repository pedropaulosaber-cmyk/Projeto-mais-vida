/*
 * Contas de cliente (login obrigatório antes da compra). Separado de
 * lib/db.ts (que cuida de vendas/eventos) para manter cada arquivo focado.
 */
import "server-only";
import { query } from "./db";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await query<{ id: number; email: string; password_hash: string }>(
    `SELECT id, email, password_hash FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  const row = rows[0];
  return row ? { id: row.id, email: row.email, passwordHash: row.password_hash } : null;
}

/** Retorna `null` se o e-mail já estiver cadastrado. */
export async function createUser(
  email: string,
  passwordHash: string,
): Promise<User | null> {
  const rows = await query<{ id: number; email: string }>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email`,
    [email.trim().toLowerCase(), passwordHash],
  );
  const row = rows[0];
  return row ? { id: row.id, email: row.email, passwordHash } : null;
}
