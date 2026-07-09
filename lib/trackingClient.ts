"use client";

/*
 * Helpers client-side de tracking (skill conversion-tracking, Passos 2, 5).
 *
 * - Captura UTMs na entrada e os PERSISTE em sessionStorage (first-touch), para
 *   sobreviverem até o clique de compra e serem repassados ao Stripe/webhook.
 * - Captura o cookie `_fbp` do Meta e converte `fbclid` da URL em `fbc`
 *   (melhora o match do Pixel com a Conversions API).
 * - Gera um id de sessão de navegação para agrupar os eventos de um mesmo visitante.
 * - `track()` grava eventos do funil no próprio banco (via /api/track), o que
 *   alimenta o painel admin sem depender de nenhuma plataforma externa.
 */

export interface TrackingContext {
  sessionId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbp?: string;
  fbc?: string;
  path: string;
}

const SID_KEY = "dbk_sid";
const UTM_KEY = "dbk_utm";

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function randomId(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
  );
}

let engagementArmed = false;

/** Chamar uma vez no carregamento da landing. Idempotente. */
export function initTracking(): void {
  if (typeof window === "undefined") return;

  if (!sessionStorage.getItem(SID_KEY)) {
    sessionStorage.setItem(SID_KEY, randomId());
  }

  // First-touch: só grava UTMs se ainda não houver e se vierem na URL.
  if (!sessionStorage.getItem(UTM_KEY)) {
    const p = new URLSearchParams(window.location.search);
    const utm = {
      utmSource: p.get("utm_source") ?? undefined,
      utmMedium: p.get("utm_medium") ?? undefined,
      utmCampaign: p.get("utm_campaign") ?? undefined,
    };
    if (utm.utmSource || utm.utmMedium || utm.utmCampaign) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  }

  armEngagement();
}

/*
 * Mede tempo de permanência e profundidade de rolagem, enviados juntos UMA vez
 * quando a aba é escondida/fechada, via sendBeacon (sobrevive à navegação).
 * Alimentam as seções "Visitas" e "Rolagem" do painel admin.
 */
function armEngagement(): void {
  if (engagementArmed) return;
  engagementArmed = true;

  const start = Date.now();
  let maxScrollPercent = 0;
  let sent = false;

  function currentScrollPercent(): number {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 100;
    return Math.min(100, Math.round(((window.scrollY || doc.scrollTop) / scrollable) * 100));
  }

  let scrollTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        maxScrollPercent = Math.max(maxScrollPercent, currentScrollPercent());
        scrollTicking = false;
      });
    },
    { passive: true },
  );

  const flush = () => {
    if (sent) return;
    sent = true;
    const seconds = Math.round((Date.now() - start) / 1000);
    if (seconds <= 0 || seconds > 3600) return;
    const ctx = getTrackingContext();
    const body = JSON.stringify({
      type: "time_on_page",
      sessionId: ctx.sessionId,
      utmSource: ctx.utmSource,
      utmMedium: ctx.utmMedium,
      utmCampaign: ctx.utmCampaign,
      path: ctx.path,
      meta: { seconds, scrollPercent: maxScrollPercent },
    });
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon("/api/track", blob)) {
        void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // best-effort
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}

export function getTrackingContext(): TrackingContext {
  const sessionId = sessionStorage.getItem(SID_KEY) ?? randomId();

  let utm: Partial<TrackingContext> = {};
  try {
    utm = JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}");
  } catch {
    utm = {};
  }

  const fbp = getCookie("_fbp");
  // fbc: se veio ?fbclid= na URL, monta o formato esperado pelo Meta; senão usa o cookie _fbc.
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  const fbc = fbclid
    ? `fb.1.${Date.now()}.${fbclid}`
    : getCookie("_fbc");

  return {
    sessionId,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    fbp,
    fbc,
    path: window.location.pathname,
  };
}

/** Dispara um evento no Meta Pixel, se carregado. */
export function trackPixel(
  event: string,
  params?: Record<string, unknown>,
): void {
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (fbq) fbq("track", event, params);
}

/** Registra um evento do funil no banco (para o painel admin). Best-effort. */
export async function track(
  type: "page_view" | "view_item" | "begin_checkout" | "cta_click",
  meta: Record<string, unknown> = {},
): Promise<void> {
  const ctx = getTrackingContext();
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        type,
        sessionId: ctx.sessionId,
        utmSource: ctx.utmSource,
        utmMedium: ctx.utmMedium,
        utmCampaign: ctx.utmCampaign,
        path: ctx.path,
        meta,
      }),
    });
  } catch {
    // tracking nunca deve quebrar a experiência do usuário
  }
}
