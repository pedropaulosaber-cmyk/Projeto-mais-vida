-- Esquema mínimo para o webhook (idempotência de vendas) e o painel admin
-- (prompt §9). Rode este arquivo uma vez no seu Postgres (Supabase / Vercel
-- Postgres) antes de ativar o webhook em produção.

CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  buyer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  -- NULL até o acesso ao Drive + e-mail de entrega serem confirmados. Separado
  -- do registro da venda em si para que uma falha de entrega (ex: Drive
  -- indisponível) seja re-tentada nos reenvios do webhook, em vez de "sumir"
  -- só porque a venda já foi gravada (ver app/api/webhook/route.ts).
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  path TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_type_created_at ON events (type, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at);
