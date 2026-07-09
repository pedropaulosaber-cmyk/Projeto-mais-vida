/*
 * Painel administrativo (prompt §9) — CRM de métricas em 4 seções: Visitas,
 * Cliques/Acesso, Rolagem, Conversão. Server Component: lê as métricas do
 * nosso banco e renderiza no servidor — nenhum dado sensível vai para o
 * client além do que é exibido. A autenticação é garantida pelo
 * middleware.ts (sessão assinada); aqui reforçamos com uma verificação do
 * cookie no próprio servidor.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import {
  getClicksSummary,
  getConversionSummary,
  getDailySales,
  getDailyVisits,
  getOrigins,
  getScrollSummary,
  getTopCtas,
  getVisitsSummary,
} from "@/lib/adminMetrics";
import { AdminAutoRefresh } from "@/components/AdminAutoRefresh";
import { AdminEventCenter } from "@/components/AdminEventCenter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIODS = [
  { days: 1, label: "24h" },
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(v: number): string {
  return (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
}

function fmtInt(v: number): string {
  return v.toLocaleString("pt-BR");
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const days = PERIODS.some((p) => String(p.days) === params.periodo)
    ? Number(params.periodo)
    : 7;

  const [visits, origins, dailyVisits, clicks, topCtas, scroll, conversion, dailySales] =
    await Promise.all([
      getVisitsSummary(days),
      getOrigins(days),
      getDailyVisits(days),
      getClicksSummary(days),
      getTopCtas(days),
      getScrollSummary(days),
      getConversionSummary(days),
      getDailySales(days),
    ]);

  const periodLabel = PERIODS.find((p) => p.days === days)?.label;

  return (
    <main style={S.main}>
      <AdminAutoRefresh intervalMs={30_000} />

      <header style={S.header}>
        <div>
          <p style={S.eyebrow}>DriveBooks</p>
          <h1 style={S.h1}>Painel de métricas</h1>
          <p style={S.sub}>
            {session.email} · últimos {periodLabel} · atualiza a cada 30s
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button type="submit" style={S.logout}>
            Sair
          </button>
        </form>
      </header>

      <nav style={S.periodNav}>
        {PERIODS.map((p) => (
          <a
            key={p.days}
            href={`/admin?periodo=${p.days}`}
            style={{ ...S.periodLink, ...(p.days === days ? S.periodLinkActive : {}) }}
          >
            {p.label}
          </a>
        ))}
      </nav>

      <AdminEventCenter />

      {/* ---------- Visitas ---------- */}
      <Section accent="#60A5FA" title="Visitas" subtitle="Quem chegou na landing">
        <StatRow
          items={[
            { label: "Visitantes", value: fmtInt(visits.visitors) },
            { label: "Page views", value: fmtInt(visits.pageViews) },
            { label: "Tempo médio na página", value: fmtDuration(visits.avgTimeOnPageSeconds) },
          ]}
        />
        <div style={S.cols}>
          <Panel title="Origem dos acessos">
            {origins.length === 0 ? (
              <Empty />
            ) : (
              <Table
                head={["Origem", "Visitantes"]}
                rows={origins.map((o) => [o.source, fmtInt(o.visitors)])}
              />
            )}
          </Panel>
          <Panel title="Visitantes por dia">
            {dailyVisits.length === 0 ? (
              <Empty />
            ) : (
              <Table
                head={["Dia", "Visitantes"]}
                rows={dailyVisits.map((d) => [d.day, fmtInt(d.visitors)])}
              />
            )}
          </Panel>
        </div>
      </Section>

      {/* ---------- Cliques / Acesso ---------- */}
      <Section accent="#FFC107" title="Cliques / Acesso" subtitle="Interesse em comprar">
        <StatRow
          items={[
            { label: "Cliques no CTA", value: fmtInt(clicks.ctaClicks) },
            { label: "Checkouts iniciados", value: fmtInt(clicks.beginCheckouts) },
            { label: "Taxa de clique (CTR)", value: fmtPct(clicks.clickThroughRate) },
          ]}
        />
        <Panel title="Botões mais clicados">
          {topCtas.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={["Botão", "Cliques"]}
              rows={topCtas.map((c) => [c.ctaId, fmtInt(c.clicks)])}
            />
          )}
        </Panel>
      </Section>

      {/* ---------- Rolagem ---------- */}
      <Section accent="#34D399" title="Rolagem" subtitle="Quanto da página é lida">
        <StatRow
          items={[
            { label: "Rolagem média", value: fmtPct(scroll.avgScrollPercent / 100) },
            { label: "Rolagem profunda (≥75%)", value: fmtPct(scroll.deepScrollRate) },
            { label: "Amostra", value: fmtInt(scroll.sampleSize) },
          ]}
        />
      </Section>

      {/* ---------- Conversão ---------- */}
      <Section accent="#F472B6" title="Conversão" subtitle="Vendas confirmadas">
        <StatRow
          items={[
            { label: "Vendas", value: fmtInt(conversion.sales) },
            { label: "Receita", value: fmtBRL(conversion.revenueCents) },
            { label: "Taxa de conversão", value: fmtPct(conversion.conversionRate) },
          ]}
        />
        <Panel title="Vendas por dia">
          {dailySales.length === 0 ? (
            <Empty />
          ) : (
            <Table
              head={["Dia", "Vendas", "Receita"]}
              rows={dailySales.map((d) => [d.day, fmtInt(d.sales), fmtBRL(d.revenueCents)])}
            />
          )}
        </Panel>
      </Section>
    </main>
  );
}

/* ---------- Componentes de apresentação ---------- */

function Section({
  accent,
  title,
  subtitle,
  children,
}: {
  accent: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <span style={{ ...S.sectionBar, background: accent }} />
        <div>
          <h2 style={S.sectionTitle}>{title}</h2>
          <p style={S.sectionSubtitle}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={S.statRow}>
      {items.map((it) => (
        <div key={it.label} style={S.statTile}>
          <div style={S.statValue}>{it.value}</div>
          <div style={S.statLabel}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={S.panel}>
      <h3 style={S.panelTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={S.table}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} style={i === 0 ? S.th : S.thNum}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={ci === 0 ? S.td : S.tdNum}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return <p style={S.empty}>Sem dados no período.</p>;
}

const S: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#0B0B0C",
    color: "#F5F5F5",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "32px clamp(16px, 4vw, 56px) 64px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#FFC107",
    fontWeight: 700,
    margin: "0 0 4px",
  },
  h1: { fontFamily: "Poppins, sans-serif", fontSize: 26, margin: 0 },
  sub: { color: "#9ca3af", fontSize: 13, margin: "6px 0 0" },
  logout: {
    background: "transparent",
    color: "#F5F5F5",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
  periodNav: { display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" },
  periodLink: {
    padding: "6px 14px",
    borderRadius: 999,
    border: "1px solid #262626",
    color: "#cfcfcf",
    textDecoration: "none",
    fontSize: 13,
  },
  periodLinkActive: {
    background: "#FFC107",
    color: "#1A1A1A",
    borderColor: "#FFC107",
    fontWeight: 700,
  },
  section: {
    marginBottom: 40,
    paddingBottom: 8,
    borderBottom: "1px solid #1c1c1c",
  },
  sectionHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  sectionBar: { width: 4, height: 32, borderRadius: 4, flexShrink: 0 },
  sectionTitle: { fontFamily: "Poppins, sans-serif", fontSize: 18, margin: 0 },
  sectionSubtitle: { color: "#9ca3af", fontSize: 12, margin: "2px 0 0" },
  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  statTile: {
    background: "#141415",
    border: "1px solid #232323",
    borderRadius: 14,
    padding: "16px 18px",
  },
  statValue: { fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 700 },
  statLabel: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  cols: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  panel: {
    background: "#141415",
    border: "1px solid #232323",
    borderRadius: 14,
    padding: 18,
  },
  panelTitle: { fontFamily: "Poppins, sans-serif", fontSize: 14, margin: "0 0 12px", color: "#e5e5e5" },
  empty: { color: "#6b7280", fontSize: 13, margin: 0 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    color: "#9ca3af",
    fontWeight: 600,
    padding: "6px 10px",
    borderBottom: "1px solid #232323",
  },
  thNum: {
    textAlign: "right",
    color: "#9ca3af",
    fontWeight: 600,
    padding: "6px 10px",
    borderBottom: "1px solid #232323",
  },
  td: { padding: "8px 10px", borderBottom: "1px solid #1a1a1a" },
  tdNum: { padding: "8px 10px", borderBottom: "1px solid #1a1a1a", textAlign: "right" },
};
