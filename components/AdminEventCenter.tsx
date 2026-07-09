"use client";

import { useEffect, useRef, useState } from "react";

interface LiveEvent {
  type: string;
  path: string | null;
  sessionId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface LiveResponse {
  liveVisitors: number;
  events: LiveEvent[];
}

const TYPE_LABEL: Record<string, string> = {
  page_view: "Visualização de página",
  view_item: "Visualização de item",
  cta_click: "Clique no botão",
  begin_checkout: "Início de checkout",
  time_on_page: "Saída da página",
  purchase: "Compra confirmada 💰",
  chargeback: "Chargeback ⚠️",
};

const TYPE_COLOR: Record<string, string> = {
  page_view: "#60A5FA",
  view_item: "#60A5FA",
  cta_click: "#FFC107",
  begin_checkout: "#FFC107",
  time_on_page: "#34D399",
  purchase: "#F472B6",
  chargeback: "#EF4444",
};

function describeEvent(ev: LiveEvent): string {
  const meta = ev.meta ?? {};
  if (ev.type === "cta_click" && typeof meta.ctaId === "string") {
    return `"${meta.ctaId}"`;
  }
  if (ev.type === "time_on_page") {
    const seconds = typeof meta.seconds === "number" ? meta.seconds : null;
    const scroll = typeof meta.scrollPercent === "number" ? meta.scrollPercent : null;
    const parts = [];
    if (seconds !== null) parts.push(`${seconds}s na página`);
    if (scroll !== null) parts.push(`${scroll}% rolado`);
    return parts.join(" · ");
  }
  if (ev.type === "purchase" && typeof meta.amountCents === "number") {
    return (meta.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return ev.path ?? "";
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/*
 * Central de eventos ao vivo: faz polling de /api/admin/live a cada 5s (não
 * usa WebSocket para manter a infra simples — o painel tem um único usuário
 * admin, então polling curto é suficiente para uma sensação de tempo real).
 */
export function AdminEventCenter() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [connected, setConnected] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/admin/live", { cache: "no-store" });
        if (!res.ok) throw new Error("live-fetch-failed");
        const json: LiveResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setConnected(true);
        }
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    void poll();
    timerRef.current = setInterval(poll, 5_000);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <section style={S.section}>
      <div style={S.sectionHead}>
        <span style={{ ...S.sectionBar, background: "#A78BFA" }} />
        <div>
          <h2 style={S.sectionTitle}>Central de eventos</h2>
          <p style={S.sectionSubtitle}>Ao vivo — atualiza a cada 5s</p>
        </div>
      </div>

      <div style={S.liveTile}>
        <span style={{ ...S.dot, background: connected ? "#34D399" : "#6b7280" }} />
        <span style={S.liveValue}>{data ? data.liveVisitors : "…"}</span>
        <span style={S.liveLabel}>
          {data?.liveVisitors === 1 ? "visitante agora" : "visitantes agora"}
        </span>
      </div>

      <div style={S.feed}>
        {!data ? (
          <p style={S.empty}>Carregando…</p>
        ) : data.events.length === 0 ? (
          <p style={S.empty}>Nenhum evento ainda.</p>
        ) : (
          data.events.map((ev, i) => (
            <div key={`${ev.createdAt}-${i}`} style={S.feedRow}>
              <span style={S.feedTime}>{fmtTime(ev.createdAt)}</span>
              <span
                style={{
                  ...S.feedType,
                  color: TYPE_COLOR[ev.type] ?? "#e5e5e5",
                }}
              >
                {TYPE_LABEL[ev.type] ?? ev.type}
              </span>
              <span style={S.feedDesc}>{describeEvent(ev)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 40,
    paddingBottom: 8,
    borderBottom: "1px solid #1c1c1c",
  },
  sectionHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  sectionBar: { width: 4, height: 32, borderRadius: 4, flexShrink: 0 },
  sectionTitle: { fontFamily: "Poppins, sans-serif", fontSize: 18, margin: 0 },
  sectionSubtitle: { color: "#9ca3af", fontSize: 12, margin: "2px 0 0" },
  liveTile: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 10,
    background: "#141415",
    border: "1px solid #232323",
    borderRadius: 14,
    padding: "14px 20px",
    marginBottom: 16,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    alignSelf: "center",
    boxShadow: "0 0 0 4px rgba(52,211,153,.15)",
  },
  liveValue: { fontFamily: "Poppins, sans-serif", fontSize: 28, fontWeight: 700 },
  liveLabel: { color: "#9ca3af", fontSize: 13 },
  feed: {
    background: "#141415",
    border: "1px solid #232323",
    borderRadius: 14,
    padding: "6px 18px",
    maxHeight: 360,
    overflowY: "auto",
  },
  feedRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #1a1a1a",
    fontSize: 13,
  },
  feedTime: { color: "#6b7280", fontVariantNumeric: "tabular-nums", flexShrink: 0 },
  feedType: { fontWeight: 700, flexShrink: 0 },
  feedDesc: { color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  empty: { color: "#6b7280", fontSize: 13, margin: "10px 0" },
};
