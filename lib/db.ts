/*
 * Acesso a dados (Postgres — Supabase/Vercel Postgres via DATABASE_URL).
 *
 * Responsabilidades:
 *   - Registrar VENDAS de forma IDEMPOTENTE (stripe_session_id é UNIQUE — o
 *     Stripe pode reenviar o mesmo evento de webhook várias vezes).
 *   - Registrar EVENTOS do funil para o painel admin (prompt §9).
 *
 * Rode db/schema.sql uma vez no banco antes de usar em produção.
 */
import "server-only";
import { Pool } from "pg";
import { requireEnv } from "./env";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: requireEnv("DATABASE_URL"),
      // O pooler do Supabase exige SSL; a CA não é verificável a partir de
      // funções serverless, então validamos a conexão (não o dado) sem checar a cadeia.
      ssl: { rejectUnauthorized: false },
    });
  }
  return _pool;
}

/**
 * Consulta de leitura para o painel admin. Mantém o pool encapsulado (não
 * exportamos o Pool) e sempre parametriza os valores para evitar injeção.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export interface SaleRecord {
  stripeSessionId: string;
  buyerEmail: string;
  amountCents: number;
  currency: string;
}

/**
 * Insere a venda se ainda não existir. Retorna `true` se esta chamada criou o
 * registro (venda nova — deve prosseguir com liberação de acesso + e-mail) ou
 * `false` se já existia (reentrega do webhook — não repetir efeitos colaterais).
 */
export async function recordSaleIdempotent(sale: SaleRecord): Promise<boolean> {
  const result = await getPool().query(
    `INSERT INTO sales (stripe_session_id, buyer_email, amount_cents, currency)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (stripe_session_id) DO NOTHING
     RETURNING id`,
    [sale.stripeSessionId, sale.buyerEmail, sale.amountCents, sale.currency],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function recordEvent(
  type: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { sessionId, utmSource, utmMedium, utmCampaign, path, ...meta } = payload as {
    sessionId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    path?: string;
    [key: string]: unknown;
  };

  await getPool().query(
    `INSERT INTO events (type, session_id, utm_source, utm_medium, utm_campaign, path, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      type,
      sessionId ?? null,
      utmSource ?? null,
      utmMedium ?? null,
      utmCampaign ?? null,
      path ?? null,
      JSON.stringify(meta ?? {}),
    ],
  );
}
