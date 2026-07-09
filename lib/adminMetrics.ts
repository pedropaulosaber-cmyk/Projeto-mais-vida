/*
 * Consultas de métricas do painel admin (prompt §9). Tudo sai do nosso próprio
 * banco (tabelas `sales` e `events`), sem depender de nenhuma plataforma externa
 * — o Meta Pixel é para otimização de anúncios; a fonte de verdade do painel é o
 * webhook + os eventos do funil.
 *
 * Todas as consultas aceitam uma janela em dias para permitir filtrar por período.
 */
import "server-only";
import { query } from "./db";

export interface Overview {
  visitors: number; // sessões únicas com page_view
  pageViews: number;
  ctaClicks: number;
  beginCheckouts: number;
  sales: number;
  revenueCents: number;
  conversionRate: number; // vendas / visitantes
  avgTimeOnPageSeconds: number;
}

export interface OriginRow {
  source: string;
  visitors: number;
  sales: number;
}

export interface SaleRow {
  buyerEmail: string;
  amountCents: number;
  currency: string;
  createdAt: string;
}

export interface DailyRow {
  day: string;
  visitors: number;
  sales: number;
}

function since(days: number): string {
  return `now() - interval '${Math.max(1, Math.min(365, Math.floor(days)))} days'`;
}

export async function getOverview(days: number): Promise<Overview> {
  const [funnel] = await query<{
    visitors: string;
    page_views: string;
    cta_clicks: string;
    begin_checkouts: string;
    avg_seconds: string | null;
  }>(
    `SELECT
       COUNT(DISTINCT session_id) FILTER (WHERE type = 'page_view')      AS visitors,
       COUNT(*)                   FILTER (WHERE type = 'page_view')      AS page_views,
       COUNT(*)                   FILTER (WHERE type = 'cta_click')      AS cta_clicks,
       COUNT(*)                   FILTER (WHERE type = 'begin_checkout') AS begin_checkouts,
       AVG((meta->>'seconds')::numeric) FILTER (WHERE type = 'time_on_page') AS avg_seconds
     FROM events
     WHERE created_at >= ${since(days)}`,
  );

  const [salesRow] = await query<{ sales: string; revenue: string | null }>(
    `SELECT COUNT(*) AS sales, COALESCE(SUM(amount_cents), 0) AS revenue
     FROM sales
     WHERE status = 'completed' AND created_at >= ${since(days)}`,
  );

  const visitors = Number(funnel?.visitors ?? 0);
  const sales = Number(salesRow?.sales ?? 0);

  return {
    visitors,
    pageViews: Number(funnel?.page_views ?? 0),
    ctaClicks: Number(funnel?.cta_clicks ?? 0),
    beginCheckouts: Number(funnel?.begin_checkouts ?? 0),
    sales,
    revenueCents: Number(salesRow?.revenue ?? 0),
    conversionRate: visitors > 0 ? sales / visitors : 0,
    avgTimeOnPageSeconds: Math.round(Number(funnel?.avg_seconds ?? 0)),
  };
}

/** Origem dos acessos por utm_source (fallback "direto/orgânico"). */
export async function getOrigins(days: number): Promise<OriginRow[]> {
  const rows = await query<{ source: string; visitors: string; sales: string }>(
    `WITH v AS (
       SELECT COALESCE(NULLIF(utm_source, ''), 'direto/orgânico') AS source,
              COUNT(DISTINCT session_id) AS visitors
       FROM events
       WHERE type = 'page_view' AND created_at >= ${since(days)}
       GROUP BY 1
     ),
     s AS (
       SELECT COALESCE(NULLIF(utm_source, ''), 'direto/orgânico') AS source,
              COUNT(DISTINCT session_id) AS sales
       FROM events
       WHERE type = 'begin_checkout' AND created_at >= ${since(days)}
       GROUP BY 1
     )
     SELECT v.source, v.visitors, COALESCE(s.sales, 0) AS sales
     FROM v LEFT JOIN s ON s.source = v.source
     ORDER BY v.visitors DESC
     LIMIT 20`,
  );
  return rows.map((r) => ({
    source: r.source,
    visitors: Number(r.visitors),
    sales: Number(r.sales),
  }));
}

export async function getRecentSales(limit = 20): Promise<SaleRow[]> {
  const rows = await query<{
    buyer_email: string;
    amount_cents: number;
    currency: string;
    created_at: string;
  }>(
    `SELECT buyer_email, amount_cents, currency, created_at
     FROM sales
     WHERE status = 'completed'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({
    buyerEmail: r.buyer_email,
    amountCents: r.amount_cents,
    currency: r.currency,
    createdAt: r.created_at,
  }));
}

export async function getDaily(days: number): Promise<DailyRow[]> {
  const rows = await query<{ day: string; visitors: string; sales: string }>(
    `WITH v AS (
       SELECT date_trunc('day', created_at) AS day,
              COUNT(DISTINCT session_id) AS visitors
       FROM events
       WHERE type = 'page_view' AND created_at >= ${since(days)}
       GROUP BY 1
     ),
     s AS (
       SELECT date_trunc('day', created_at) AS day, COUNT(*) AS sales
       FROM sales
       WHERE status = 'completed' AND created_at >= ${since(days)}
       GROUP BY 1
     )
     SELECT to_char(COALESCE(v.day, s.day), 'YYYY-MM-DD') AS day,
            COALESCE(v.visitors, 0) AS visitors,
            COALESCE(s.sales, 0) AS sales
     FROM v FULL OUTER JOIN s ON s.day = v.day
     ORDER BY day DESC
     LIMIT 30`,
  );
  return rows.map((r) => ({
    day: r.day,
    visitors: Number(r.visitors),
    sales: Number(r.sales),
  }));
}
