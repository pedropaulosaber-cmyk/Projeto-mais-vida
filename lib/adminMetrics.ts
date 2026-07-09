/*
 * Consultas de métricas do painel admin (prompt §9), organizadas nas mesmas 4
 * seções do dashboard: Visitas, Cliques/Acesso, Rolagem, Conversão. Tudo sai
 * do nosso próprio banco (tabelas `sales` e `events`), sem depender de
 * nenhuma plataforma externa.
 *
 * Todas as consultas aceitam uma janela em dias para permitir filtrar por período.
 */
import "server-only";
import { query } from "./db";

export interface VisitsSummary {
  visitors: number; // sessões únicas com page_view
  pageViews: number;
  avgTimeOnPageSeconds: number;
}

export interface OriginRow {
  source: string;
  visitors: number;
}

export interface DailyVisitsRow {
  day: string;
  visitors: number;
}

export interface ClicksSummary {
  ctaClicks: number;
  beginCheckouts: number;
  clickThroughRate: number; // cliques no CTA / visitantes
}

export interface CtaRow {
  ctaId: string;
  clicks: number;
}

export interface ScrollSummary {
  avgScrollPercent: number;
  deepScrollRate: number; // % de sessões que rolaram ≥ 75%
  sampleSize: number;
}

export interface ConversionSummary {
  sales: number;
  revenueCents: number;
  conversionRate: number; // vendas / visitantes
}

export interface DailySalesRow {
  day: string;
  sales: number;
  revenueCents: number;
}

export interface EventRow {
  type: string;
  path: string | null;
  sessionId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

function since(days: number): string {
  return `now() - interval '${Math.max(1, Math.min(365, Math.floor(days)))} days'`;
}

/* ---------- Central de eventos (tempo real) ---------- */

/**
 * Visitantes com pulso (heartbeat ou page_view) nos últimos `windowSeconds` —
 * aproximação de "quem está na página agora" sem precisar de WebSocket.
 */
export async function getLiveVisitorsCount(windowSeconds = 40): Promise<number> {
  const [row] = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT session_id) AS count
     FROM events
     WHERE type IN ('heartbeat', 'page_view')
       AND session_id IS NOT NULL
       AND created_at >= now() - interval '${Math.max(5, Math.min(600, Math.floor(windowSeconds)))} seconds'`,
  );
  return Number(row?.count ?? 0);
}

/** Feed cru dos últimos eventos do funil, para a Central de eventos. Heartbeats ficam de fora — só alimentam o contador ao vivo, não o feed. */
export async function getRecentEvents(limit = 40): Promise<EventRow[]> {
  const rows = await query<{
    type: string;
    path: string | null;
    session_id: string | null;
    meta: unknown;
    created_at: string;
  }>(
    `SELECT type, path, session_id, meta, created_at
     FROM events
     WHERE type != 'heartbeat'
     ORDER BY created_at DESC
     LIMIT $1`,
    [Math.max(1, Math.min(100, limit))],
  );
  return rows.map((r) => ({
    type: r.type,
    path: r.path,
    sessionId: r.session_id,
    meta: (r.meta as Record<string, unknown>) ?? null,
    createdAt: r.created_at,
  }));
}

/* ---------- Visitas ---------- */

export async function getVisitsSummary(days: number): Promise<VisitsSummary> {
  const [row] = await query<{
    visitors: string;
    page_views: string;
    avg_seconds: string | null;
  }>(
    `SELECT
       COUNT(DISTINCT session_id) FILTER (WHERE type = 'page_view') AS visitors,
       COUNT(*)                   FILTER (WHERE type = 'page_view') AS page_views,
       AVG((meta->>'seconds')::numeric) FILTER (WHERE type = 'time_on_page') AS avg_seconds
     FROM events
     WHERE created_at >= ${since(days)}`,
  );
  return {
    visitors: Number(row?.visitors ?? 0),
    pageViews: Number(row?.page_views ?? 0),
    avgTimeOnPageSeconds: Math.round(Number(row?.avg_seconds ?? 0)),
  };
}

/** Origem dos acessos por utm_source (fallback "direto/orgânico"). */
export async function getOrigins(days: number): Promise<OriginRow[]> {
  const rows = await query<{ source: string; visitors: string }>(
    `SELECT COALESCE(NULLIF(utm_source, ''), 'direto/orgânico') AS source,
            COUNT(DISTINCT session_id) AS visitors
     FROM events
     WHERE type = 'page_view' AND created_at >= ${since(days)}
     GROUP BY 1
     ORDER BY visitors DESC
     LIMIT 20`,
  );
  return rows.map((r) => ({ source: r.source, visitors: Number(r.visitors) }));
}

export async function getDailyVisits(days: number): Promise<DailyVisitsRow[]> {
  const rows = await query<{ day: string; visitors: string }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            COUNT(DISTINCT session_id) AS visitors
     FROM events
     WHERE type = 'page_view' AND created_at >= ${since(days)}
     GROUP BY 1
     ORDER BY 1 DESC
     LIMIT 30`,
  );
  return rows.map((r) => ({ day: r.day, visitors: Number(r.visitors) }));
}

/* ---------- Cliques / Acesso ---------- */

export async function getClicksSummary(days: number): Promise<ClicksSummary> {
  const [row] = await query<{
    visitors: string;
    cta_clicks: string;
    begin_checkouts: string;
  }>(
    `SELECT
       COUNT(DISTINCT session_id) FILTER (WHERE type = 'page_view')      AS visitors,
       COUNT(*)                   FILTER (WHERE type = 'cta_click')      AS cta_clicks,
       COUNT(*)                   FILTER (WHERE type = 'begin_checkout') AS begin_checkouts
     FROM events
     WHERE created_at >= ${since(days)}`,
  );
  const visitors = Number(row?.visitors ?? 0);
  const ctaClicks = Number(row?.cta_clicks ?? 0);
  return {
    ctaClicks,
    beginCheckouts: Number(row?.begin_checkouts ?? 0),
    clickThroughRate: visitors > 0 ? ctaClicks / visitors : 0,
  };
}

/** Quais botões de compra (texto do CTA) recebem mais cliques. */
export async function getTopCtas(days: number): Promise<CtaRow[]> {
  const rows = await query<{ cta_id: string | null; clicks: string }>(
    `SELECT COALESCE(NULLIF(meta->>'ctaId', ''), 'não identificado') AS cta_id,
            COUNT(*) AS clicks
     FROM events
     WHERE type = 'cta_click' AND created_at >= ${since(days)}
     GROUP BY 1
     ORDER BY clicks DESC
     LIMIT 10`,
  );
  return rows.map((r) => ({ ctaId: r.cta_id ?? "não identificado", clicks: Number(r.clicks) }));
}

/* ---------- Rolagem ---------- */

export async function getScrollSummary(days: number): Promise<ScrollSummary> {
  const [row] = await query<{ avg_scroll: string | null; deep: string; total: string }>(
    `SELECT
       AVG((meta->>'scrollPercent')::numeric) AS avg_scroll,
       COUNT(*) FILTER (WHERE (meta->>'scrollPercent')::numeric >= 75) AS deep,
       COUNT(*) AS total
     FROM events
     WHERE type = 'time_on_page' AND meta ? 'scrollPercent' AND created_at >= ${since(days)}`,
  );
  const total = Number(row?.total ?? 0);
  const deep = Number(row?.deep ?? 0);
  return {
    avgScrollPercent: Math.round(Number(row?.avg_scroll ?? 0)),
    deepScrollRate: total > 0 ? deep / total : 0,
    sampleSize: total,
  };
}

/* ---------- Conversão ---------- */

export async function getConversionSummary(days: number): Promise<ConversionSummary> {
  const [visitRow] = await query<{ visitors: string }>(
    `SELECT COUNT(DISTINCT session_id) AS visitors
     FROM events
     WHERE type = 'page_view' AND created_at >= ${since(days)}`,
  );
  const [saleRow] = await query<{ sales: string; revenue: string | null }>(
    `SELECT COUNT(*) AS sales, COALESCE(SUM(amount_cents), 0) AS revenue
     FROM sales
     WHERE status = 'completed' AND created_at >= ${since(days)}`,
  );

  const visitors = Number(visitRow?.visitors ?? 0);
  const sales = Number(saleRow?.sales ?? 0);

  return {
    sales,
    revenueCents: Number(saleRow?.revenue ?? 0),
    conversionRate: visitors > 0 ? sales / visitors : 0,
  };
}

export async function getDailySales(days: number): Promise<DailySalesRow[]> {
  const rows = await query<{ day: string; sales: string; revenue: string }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            COUNT(*) AS sales,
            COALESCE(SUM(amount_cents), 0) AS revenue
     FROM sales
     WHERE status = 'completed' AND created_at >= ${since(days)}
     GROUP BY 1
     ORDER BY 1 DESC
     LIMIT 30`,
  );
  return rows.map((r) => ({
    day: r.day,
    sales: Number(r.sales),
    revenueCents: Number(r.revenue),
  }));
}
