/*
 * Painel administrativo (prompt §9). Server Component: lê as métricas do nosso
 * banco e renderiza no servidor — nenhum dado sensível vai para o client além do
 * que é exibido. A autenticação é garantida pelo middleware.ts (sessão assinada);
 * aqui reforçamos com uma verificação do cookie no próprio servidor.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import {
  getDaily,
  getOrigins,
  getOverview,
  getRecentSales,
} from "@/lib/adminMetrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIODS = [
  { days: 1, label: "24h" },
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtPct(v: number): string {
  return (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const head = user.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  // Defesa em profundidade: além do middleware, valida a sessão aqui.
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const days = PERIODS.some((p) => String(p.days) === params.periodo)
    ? Number(params.periodo)
    : 7;

  const [overview, origins, sales, daily] = await Promise.all([
    getOverview(days),
    getOrigins(days),
    getRecentSales(20),
    getDaily(days),
  ]);

  const cards = [
    { label: "Visitantes", value: overview.visitors.toLocaleString("pt-BR") },
    { label: "Page views", value: overview.pageViews.toLocaleString("pt-BR") },
    { label: "Cliques no CTA", value: overview.ctaClicks.toLocaleString("pt-BR") },
    { label: "Checkouts iniciados", value: overview.beginCheckouts.toLocaleString("pt-BR") },
    { label: "Vendas", value: overview.sales.toLocaleString("pt-BR") },
    { label: "Receita", value: fmtBRL(overview.revenueCents) },
    { label: "Taxa de conversão", value: fmtPct(overview.conversionRate) },
    { label: "Tempo médio na página", value: fmtDuration(overview.avgTimeOnPageSeconds) },
  ];

  return (
    <main style={S.main}>
      <header style={S.header}>
        <div>
          <h1 style={S.h1}>Painel DriveBooks</h1>
          <p style={S.sub}>
            Logado como {session.email} · dados dos últimos{" "}
            {PERIODS.find((p) => p.days === days)?.label}
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
            style={{
              ...S.periodLink,
              ...(p.days === days ? S.periodLinkActive : {}),
            }}
          >
            {p.label}
          </a>
        ))}
      </nav>

      <section style={S.grid}>
        {cards.map((c) => (
          <div key={c.label} style={S.card}>
            <div style={S.cardValue}>{c.value}</div>
            <div style={S.cardLabel}>{c.label}</div>
          </div>
        ))}
      </section>

      <div style={S.cols}>
        <section style={S.panel}>
          <h2 style={S.h2}>Origem dos acessos</h2>
          {origins.length === 0 ? (
            <p style={S.empty}>Sem dados no período.</p>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Origem</th>
                  <th style={S.thNum}>Visitantes</th>
                  <th style={S.thNum}>Checkouts</th>
                </tr>
              </thead>
              <tbody>
                {origins.map((o) => (
                  <tr key={o.source}>
                    <td style={S.td}>{o.source}</td>
                    <td style={S.tdNum}>{o.visitors.toLocaleString("pt-BR")}</td>
                    <td style={S.tdNum}>{o.sales.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section style={S.panel}>
          <h2 style={S.h2}>Visitantes × vendas por dia</h2>
          {daily.length === 0 ? (
            <p style={S.empty}>Sem dados no período.</p>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Dia</th>
                  <th style={S.thNum}>Visitantes</th>
                  <th style={S.thNum}>Vendas</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.day}>
                    <td style={S.td}>{d.day}</td>
                    <td style={S.tdNum}>{d.visitors.toLocaleString("pt-BR")}</td>
                    <td style={S.tdNum}>{d.sales.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section style={S.panel}>
        <h2 style={S.h2}>Vendas recentes</h2>
        {sales.length === 0 ? (
          <p style={S.empty}>Nenhuma venda registrada ainda.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Data</th>
                <th style={S.th}>Comprador</th>
                <th style={S.thNum}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s, i) => (
                <tr key={i}>
                  <td style={S.td}>{fmtDateTime(s.createdAt)}</td>
                  <td style={S.td}>{maskEmail(s.buyerEmail)}</td>
                  <td style={S.tdNum}>{fmtBRL(s.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#0F0F0F",
    color: "#F5F5F5",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "32px clamp(16px, 4vw, 48px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  h1: { fontFamily: "Poppins, sans-serif", fontSize: 24, margin: 0 },
  sub: { color: "#9ca3af", fontSize: 13, margin: "4px 0 0" },
  logout: {
    background: "transparent",
    color: "#F5F5F5",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
  periodNav: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  periodLink: {
    padding: "6px 14px",
    borderRadius: 999,
    border: "1px solid #2a2a2a",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 28,
  },
  card: {
    background: "#171717",
    border: "1px solid #262626",
    borderRadius: 14,
    padding: 16,
  },
  cardValue: { fontFamily: "Poppins, sans-serif", fontSize: 22, fontWeight: 700 },
  cardLabel: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  cols: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  panel: {
    background: "#171717",
    border: "1px solid #262626",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    overflowX: "auto",
  },
  h2: { fontFamily: "Poppins, sans-serif", fontSize: 16, margin: "0 0 14px" },
  empty: { color: "#9ca3af", fontSize: 13, margin: 0 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    color: "#9ca3af",
    fontWeight: 600,
    padding: "8px 10px",
    borderBottom: "1px solid #262626",
  },
  thNum: {
    textAlign: "right",
    color: "#9ca3af",
    fontWeight: 600,
    padding: "8px 10px",
    borderBottom: "1px solid #262626",
  },
  td: { padding: "8px 10px", borderBottom: "1px solid #1e1e1e" },
  tdNum: { padding: "8px 10px", borderBottom: "1px solid #1e1e1e", textAlign: "right" },
};
