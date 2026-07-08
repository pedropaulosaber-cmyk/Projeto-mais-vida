"use client";

import { useEffect, useRef } from "react";
import { LANDING_HTML } from "./landingMarkup";
import { LANDING_HTML_DESKTOP } from "./landingMarkupDesktop";

/*
 * Renderiza o design fiel da landing (DriveBooks, feito no Claude Design) e
 * conecta os CTAs à funcionalidade de compra.
 *
 * Todos os botões de compra no design são <a href="#CHECKOUT_LINK">. Aqui, um
 * handler delegado intercepta o clique e:
 *   - se NEXT_PUBLIC_CHECKOUT_URL estiver definido (ex: link Hotmart/Kiwify/Stripe),
 *     redireciona direto para lá;
 *   - senão, chama POST /api/checkout (fluxo do próprio projeto). Enquanto esse
 *     endpoint é stub (etapa do Stripe), degrada com uma mensagem amigável.
 *
 * Na etapa da skill conversion-tracking, este é o ponto onde disparam os eventos
 * cta_click / begin_checkout (com o texto/posição do CTA clicado).
 */
export function LandingClient() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    async function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>('a[href="#CHECKOUT_LINK"]');
      if (!link) return;

      e.preventDefault();
      const ctaId = (link.textContent || "cta").trim().slice(0, 40);

      // TODO(conversion-tracking): trackEvent("cta_click", { ctaId });
      // TODO(conversion-tracking): trackEvent("begin_checkout");

      const externalUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;
      if (externalUrl) {
        window.location.href = externalUrl;
        return;
      }

      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ctaId }),
        });
        if (!res.ok) throw new Error("checkout-indisponivel");
        const data: { url?: string } = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error("sem-url");
      } catch {
        window.alert(
          "O checkout ainda será ativado. Configure NEXT_PUBLIC_CHECKOUT_URL " +
            "(link de pagamento) ou finalize a etapa do Stripe para concluir a compra.",
        );
      }
    }

    root.addEventListener("click", handleClick);
    return () => root.removeEventListener("click", handleClick);
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
    </div>
  );
}
