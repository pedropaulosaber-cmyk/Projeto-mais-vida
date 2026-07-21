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

// Preço só para os eventos de tracking (o valor cobrado de verdade é definido
// no servidor — lib/product.ts#getPriceCents). Manter alinhado ao preço real.
const CHECKOUT_VALUE = 24.9;

// Velocidade de fluxo automático do carrossel "Uma amostra do acervo", em px/s.
const CAROUSEL_SPEED_PX_S = 75;

/*
 * Motor do carrossel "Uma amostra do acervo": cada trilha (mobile/desktop) é
 * uma faixa de imagens duplicada uma vez (para dar loop contínuo) com
 * width:max-content — sem nenhuma animação CSS. Este loop via
 * requestAnimationFrame aplica o transform diretamente:
 *   - flui sozinho a uma velocidade constante por padrão;
 *   - se o usuário arrasta a barra (<input type="range" data-carousel-scrub>)
 *     logo abaixo, a posição passa a seguir o dedo/mouse (o fluxo automático
 *     pausa);
 *   - ao soltar, o fluxo automático retoma da posição em que parou — nunca
 *     reseta nem pula.
 * position "envolve" (wrap) em metade da largura da trilha, já que a segunda
 * metade é uma cópia idêntica da primeira (loop perfeito).
 */
function setupCarousels(root: HTMLElement): () => void {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const tracks = Array.from(
    root.querySelectorAll<HTMLElement>("[data-carousel-track]"),
  );
  if (tracks.length === 0) return () => {};

  const cleanups: (() => void)[] = [];
  let rafId: number | null = null;

  interface Engine {
    track: HTMLElement;
    scrub: HTMLInputElement | null;
    position: number; // px, 0..halfWidth
    halfWidth: number;
    dragging: boolean;
  }

  const engines: Engine[] = tracks.map((track) => {
    const wrap = track.parentElement;
    const scrub = wrap?.parentElement?.querySelector<HTMLInputElement>(
      "[data-carousel-scrub]",
    ) ?? null;
    return { track, scrub, position: 0, halfWidth: 0, dragging: false };
  });

  function measure(engine: Engine) {
    // A trilha tem o conjunto de imagens duplicado uma vez — metade da
    // largura total é um ciclo completo.
    engine.halfWidth = engine.track.scrollWidth / 2 || 1;
  }

  engines.forEach((engine) => {
    measure(engine);
    engine.track.style.transform = "translateX(0px)";

    // Imagens lazy mudam a largura conforme carregam — recalcula sob demanda.
    const ro = new ResizeObserver(() => measure(engine));
    ro.observe(engine.track);
    cleanups.push(() => ro.disconnect());

    if (engine.scrub) {
      const scrub = engine.scrub;

      const onInput = () => {
        engine.dragging = true;
        const frac = Number(scrub.value) / 1000;
        engine.position = frac * engine.halfWidth;
        engine.track.style.transform = `translateX(${-engine.position}px)`;
      };
      const onRelease = () => {
        engine.dragging = false;
      };

      scrub.addEventListener("input", onInput);
      scrub.addEventListener("change", onRelease);
      scrub.addEventListener("pointerup", onRelease);
      scrub.addEventListener("touchend", onRelease);
      cleanups.push(() => {
        scrub.removeEventListener("input", onInput);
        scrub.removeEventListener("change", onRelease);
        scrub.removeEventListener("pointerup", onRelease);
        scrub.removeEventListener("touchend", onRelease);
      });
    }
  });

  if (!prefersReducedMotion) {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // trava dt em picos (ex: aba volta do background)
      last = now;

      engines.forEach((engine) => {
        if (engine.dragging || engine.halfWidth <= 1) return;
        engine.position = (engine.position + CAROUSEL_SPEED_PX_S * dt) % engine.halfWidth;
        engine.track.style.transform = `translateX(${-engine.position}px)`;
        if (engine.scrub) {
          engine.scrub.value = String(
            Math.round((engine.position / engine.halfWidth) * 1000),
          );
        }
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    cleanups.forEach((fn) => fn());
  };
}

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
  const [redirecting, setRedirecting] = useState(false);
  // Pop-up de intenção: aparece uma vez quando o visitante rola ~70% da página
  // (sinal de interesse), com uma chamada curta e acesso direto ao checkout.
  const [showPopup, setShowPopup] = useState(false);
  // Guarda síncrono contra clique duplo (o estado do React pode estar "atrasado").
  const redirectingRef = useRef(false);
  // Sessão de checkout iniciada já no toque/mouse-down do CTA (antes do clique),
  // para o redirecionamento ao Stripe ser praticamente instantâneo.
  const prefetchRef = useRef<{ ctaId: string; promise: Promise<string | null> } | null>(null);

  // Cria a Checkout Session no servidor e devolve a URL (ou null em falha).
  // Não dispara tracking nem redireciona — só obtém a URL.
  function requestCheckoutUrl(ctaId: string): Promise<string | null> {
    const ctx = getTrackingContext();
    return fetch("/api/checkout", {
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
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { url?: string } | null) => data?.url ?? null)
      .catch(() => null);
  }

  async function proceedToCheckout(ctaId: string) {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    setRedirecting(true);

    // Eventos de funil: no nosso banco (painel admin) + no Meta Pixel.
    void track("cta_click", { ctaId });
    void track("begin_checkout");
    trackPixel("InitiateCheckout", { value: CHECKOUT_VALUE, currency: "BRL" });

    const externalUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;
    if (externalUrl) {
      window.location.href = externalUrl;
      return;
    }

    // Reaproveita a sessão pré-criada no toque; se não houver (ou for de outro
    // CTA), cria agora.
    const pending =
      prefetchRef.current && prefetchRef.current.ctaId === ctaId
        ? prefetchRef.current.promise
        : requestCheckoutUrl(ctaId);

    const url = await pending;
    if (url) {
      window.location.href = url;
      return;
    }

    redirectingRef.current = false;
    setRedirecting(false);
    prefetchRef.current = null;
    window.alert(
      "Não foi possível iniciar o checkout agora. Tente novamente em instantes.",
    );
  }

  useEffect(() => {
    // Captura UTMs/fbp/fbc e registra a visita (skill conversion-tracking).
    initTracking();
    void track("page_view");

    const root = ref.current;
    if (!root) return;

    function ctaFrom(e: Event): HTMLAnchorElement | null {
      const target = e.target as HTMLElement | null;
      return target?.closest<HTMLAnchorElement>('a[href="#CHECKOUT_LINK"]') ?? null;
    }

    // No mouse-down/toque, começa a criar a sessão do Stripe (antes do clique),
    // para o clique redirecionar quase instantâneo.
    function handlePointerDown(e: Event) {
      const link = ctaFrom(e);
      if (!link || process.env.NEXT_PUBLIC_CHECKOUT_URL) return;
      const ctaId = (link.textContent || "cta").trim().slice(0, 40);
      if (prefetchRef.current?.ctaId !== ctaId) {
        prefetchRef.current = { ctaId, promise: requestCheckoutUrl(ctaId) };
      }
    }

    // No clique, vai direto para o checkout (sem nenhum aviso/modal no meio).
    function handleClick(e: MouseEvent) {
      const link = ctaFrom(e);
      if (!link) return;
      e.preventDefault();
      const ctaId = (link.textContent || "cta").trim().slice(0, 40);
      void proceedToCheckout(ctaId);
    }

    root.addEventListener("pointerdown", handlePointerDown);
    root.addEventListener("click", handleClick);

    // Pop-up ao atingir ~70% de rolagem — uma vez por sessão de navegação.
    const POPUP_KEY = "dbk_popup70";
    function onScroll() {
      if (sessionStorage.getItem(POPUP_KEY)) {
        window.removeEventListener("scroll", onScroll);
        return;
      }
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      if (pct >= 70) {
        sessionStorage.setItem(POPUP_KEY, "1");
        setShowPopup(true);
        // Pré-cria a sessão do Stripe para o CTA do pop-up redirecionar rápido.
        if (!process.env.NEXT_PUBLIC_CHECKOUT_URL) {
          prefetchRef.current = { ctaId: "popup-70", promise: requestCheckoutUrl("popup-70") };
        }
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    const carouselCleanup = setupCarousels(root);

    return () => {
      root.removeEventListener("pointerdown", handlePointerDown);
      root.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", onScroll);
      carouselCleanup();
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

      {/* Pop-up de intenção (70% de rolagem) — frase curta + acesso direto ao checkout. */}
      {showPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-title"
          style={S.popupOverlay}
          onClick={() => setShowPopup(false)}
        >
          <div style={S.popupCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Fechar"
              style={S.popupClose}
              onClick={() => setShowPopup(false)}
            >
              ×
            </button>
            <div style={S.popupBadge}>🔥 OFERTA POR TEMPO LIMITADO</div>
            <h2 id="popup-title" style={S.popupTitle}>
              1.500+ livros digitais
            </h2>
            <div style={S.popupPriceRow}>
              <span style={S.popupOldPrice}>R$ 89,90</span>
              <span style={S.popupNewPrice}>R$ 24,90</span>
            </div>
            <p style={S.popupSub}>pagamento único · acesso vitalício</p>
            <button
              type="button"
              style={S.popupCta}
              onClick={() => {
                setShowPopup(false);
                void proceedToCheckout("popup-70");
              }}
            >
              GARANTIR MINHA OFERTA →
            </button>
            <button type="button" style={S.popupDismiss} onClick={() => setShowPopup(false)}>
              Não quero o desconto
            </button>
          </div>
        </div>
      )}

      {/* Spinner leve enquanto a sessão do Stripe é criada e o redirect acontece. */}
      {redirecting && (
        <div style={S.overlay} aria-live="polite" aria-busy="true">
          <div style={S.spinner} />
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(255,255,255,.6)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  spinner: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "4px solid #FFE9A6",
    borderTopColor: "#FFC107",
    animation: "dbk-spin .8s linear infinite",
  },
  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1100,
  },
  popupCard: {
    position: "relative",
    width: "100%",
    maxWidth: 360,
    background: "#fff",
    borderRadius: 20,
    padding: "30px 24px 22px",
    textAlign: "center",
    boxShadow: "0 30px 70px -25px rgba(0,0,0,.55)",
  },
  popupClose: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 30,
    height: 30,
    border: "none",
    background: "transparent",
    color: "#9ca3af",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
  },
  popupBadge: {
    display: "inline-block",
    background: "#1A1A1A",
    color: "#FFD54F",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: ".06em",
    padding: "7px 14px",
    borderRadius: 999,
    marginBottom: 16,
  },
  popupTitle: {
    fontFamily: "Poppins, sans-serif",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.2,
    color: "#1A1A1A",
    margin: "0 0 10px",
    letterSpacing: "-.02em",
  },
  popupPriceRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 12,
    margin: "0 0 6px",
  },
  popupOldPrice: {
    fontFamily: "Poppins, sans-serif",
    fontSize: 20,
    fontWeight: 600,
    color: "#9ca3af",
    textDecoration: "line-through",
  },
  popupNewPrice: {
    fontFamily: "Poppins, sans-serif",
    fontSize: 40,
    fontWeight: 800,
    color: "#1A1A1A",
    lineHeight: 1,
  },
  popupSub: { fontSize: 13, color: "#6b7280", margin: "0 0 20px" },
  popupCta: {
    display: "block",
    width: "100%",
    background: "#FFC107",
    color: "#1A1A1A",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 800,
    fontSize: 16,
    border: "none",
    borderRadius: 12,
    padding: "16px",
    cursor: "pointer",
    boxShadow: "0 12px 26px -12px rgba(255,193,7,.9)",
  },
  popupDismiss: {
    display: "block",
    width: "100%",
    background: "transparent",
    color: "#9ca3af",
    fontSize: 13,
    border: "none",
    padding: "12px 0 2px",
    cursor: "pointer",
  },
};
