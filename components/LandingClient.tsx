"use client";

import { useEffect, useRef, useState } from "react";
import { LANDING_HTML } from "./landingMarkup";
import { LANDING_HTML_DESKTOP } from "./landingMarkupDesktop";
import {
  initTracking,
  getTrackingContext,
  track,
  trackPixel,
} from "@/lib/trackingClient";

// Preço só para os eventos de tracking (o valor cobrado de verdade vem do Stripe).
const CHECKOUT_VALUE = 39.9;

/*
 * Renderiza o design fiel da landing (DriveBooks, feito no Claude Design) e
 * conecta os CTAs à funcionalidade de compra.
 *
 * Todos os botões de compra no design são <a href="#CHECKOUT_LINK">. Aqui, um
 * handler delegado intercepta o clique e abre um aviso (modal) confirmando
 * que o comprador deve usar, na tela do Stripe, o e-mail onde quer receber o
 * acesso ao Drive — só depois de confirmar é que seguimos para o checkout.
 * Isso evita o caso comum de alguém digitar um e-mail errado na hora de pagar
 * e não receber o acesso.
 *
 * Na etapa da skill conversion-tracking, este é o ponto onde disparam os eventos
 * cta_click / begin_checkout (com o texto/posição do CTA clicado).
 */
export function LandingClient() {
  const ref = useRef<HTMLDivElement>(null);
  const [pendingCta, setPendingCta] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  async function proceedToCheckout(ctaId: string) {
    setRedirecting(true);

    // Eventos de funil: no nosso banco (painel admin) + no Meta Pixel.
    void track("cta_click", { ctaId });
    void track("begin_checkout");
    trackPixel("InitiateCheckout", { value: CHECKOUT_VALUE, currency: "BRL" });

    const ctx = getTrackingContext();

    const externalUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;
    if (externalUrl) {
      window.location.href = externalUrl;
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ctaId,
          sessionId: ctx.sessionId,
          utmSource: ctx.utmSource,
          utmMedium: ctx.utmMedium,
          utmCampaign: ctx.utmCampaign,
          fbp: ctx.fbp,
          fbc: ctx.fbc,
        }),
      });
      if (!res.ok) throw new Error("checkout-indisponivel");
      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("sem-url");
    } catch {
      setRedirecting(false);
      window.alert(
        "O checkout ainda será ativado. Configure NEXT_PUBLIC_CHECKOUT_URL " +
          "(link de pagamento) ou finalize a etapa do Stripe para concluir a compra.",
      );
    }
  }

  useEffect(() => {
    // Captura UTMs/fbp/fbc e registra a visita (skill conversion-tracking).
    initTracking();
    void track("page_view");

    const root = ref.current;
    if (!root) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>('a[href="#CHECKOUT_LINK"]');
      if (!link) return;

      e.preventDefault();
      const ctaId = (link.textContent || "cta").trim().slice(0, 40);
      setPendingCta(ctaId);
    }

    root.addEventListener("click", handleClick);

    // Carrossel "Uma amostra do acervo": desliza o dedo/mouse por cima para
    // acelerar a animação temporariamente — some volta à velocidade normal
    // um instante depois que o toque para.
    const tracks = Array.from(
      root.querySelectorAll<HTMLElement>("[data-carousel-track]"),
    );
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const boostTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
    const boostCleanups: (() => void)[] = [];

    if (!prefersReducedMotion) {
      const BOOST_DURATION = "6s";
      const COOLDOWN_MS = 800;

      tracks.forEach((el) => {
        const zone = el.parentElement ?? el; // wrapper com overflow:hidden, área visível do carrossel
        const boost = () => {
          el.style.animationDuration = BOOST_DURATION;
          const existing = boostTimers.get(el);
          if (existing) clearTimeout(existing);
          boostTimers.set(
            el,
            setTimeout(() => {
              el.style.animationDuration = el.dataset.duration ?? "";
              boostTimers.delete(el);
            }, COOLDOWN_MS),
          );
        };
        zone.addEventListener("touchstart", boost, { passive: true });
        zone.addEventListener("touchmove", boost, { passive: true });
        zone.addEventListener("pointerdown", boost);
        boostCleanups.push(() => {
          zone.removeEventListener("touchstart", boost);
          zone.removeEventListener("touchmove", boost);
          zone.removeEventListener("pointerdown", boost);
        });
      });
    }

    return () => {
      root.removeEventListener("click", handleClick);
      boostCleanups.forEach((fn) => fn());
      boostTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  /*
   * Mobile e desktop convivem: os dois markups são renderizados e a troca é
   * feita por CSS (media query em 1024px, ver app/globals.css), o que é
   * SSR-friendly e funciona sem JS. Ambos ficam dentro do mesmo <div ref>,
   * então o handler delegado de checkout cobre os CTAs das duas versões.
   */
  return (
    <div ref={ref}>
      <div className="dc-mobile" dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
      <div className="dc-desktop" dangerouslySetInnerHTML={{ __html: LANDING_HTML_DESKTOP }} />

      {pendingCta !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-notice-title"
          style={S.overlay}
          onClick={() => !redirecting && setPendingCta(null)}
        >
          <div style={S.card} onClick={(e) => e.stopPropagation()}>
            <div style={S.icon}>📧</div>
            <h2 id="email-notice-title" style={S.title}>
              Atenção ao e-mail
            </h2>
            <p style={S.text}>
              Na próxima tela, o Stripe vai pedir seu e-mail para o pagamento.
              Use o e-mail onde você quer receber o acesso à biblioteca — é
              para esse endereço que enviaremos o convite do Google Drive.
            </p>
            <button
              type="button"
              style={S.confirmBtn}
              disabled={redirecting}
              onClick={() => proceedToCheckout(pendingCta)}
            >
              {redirecting ? "Redirecionando…" : "Entendi, continuar para o pagamento"}
            </button>
            <button
              type="button"
              style={S.cancelBtn}
              disabled={redirecting}
              onClick={() => setPendingCta(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#fff",
    borderRadius: 18,
    padding: "28px 24px",
    textAlign: "center",
    boxShadow: "0 24px 60px -20px rgba(0,0,0,.5)",
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: {
    fontFamily: "Poppins, sans-serif",
    fontSize: 19,
    fontWeight: 800,
    color: "#1A1A1A",
    margin: "0 0 10px",
  },
  text: {
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    lineHeight: 1.55,
    color: "#4b4b4b",
    margin: "0 0 20px",
  },
  confirmBtn: {
    display: "block",
    width: "100%",
    background: "#FFC107",
    color: "#1A1A1A",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 800,
    fontSize: 15,
    border: "none",
    borderRadius: 12,
    padding: "15px",
    cursor: "pointer",
    marginBottom: 10,
  },
  cancelBtn: {
    display: "block",
    width: "100%",
    background: "transparent",
    color: "#6b7280",
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    border: "none",
    padding: "6px",
    cursor: "pointer",
  },
};
