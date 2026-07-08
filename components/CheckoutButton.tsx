"use client";

import { useState } from "react";
import styles from "./landing.module.css";

/*
 * Botão de compra (client). Contrato da arquitetura: só chama POST /api/checkout
 * e redireciona para a URL do Stripe — NUNCA fala direto com o Stripe.
 *
 * Na etapa da skill conversion-tracking, o clique aqui dispara os eventos
 * `cta_click` (com o id do CTA, para o painel admin — prompt §9) e `begin_checkout`.
 *
 * Enquanto /api/checkout ainda é stub (Etapa 7 = stripe-drive-checkout), o botão
 * degrada com uma mensagem amigável em vez de quebrar.
 */
export function CheckoutButton({
  children,
  ctaId,
}: {
  children: React.ReactNode;
  ctaId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    // TODO(conversion-tracking): trackEvent("cta_click", { ctaId });
    // TODO(conversion-tracking): trackEvent("begin_checkout");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ctaId }),
      });

      if (!res.ok) {
        // 501 enquanto o checkout não está implementado.
        throw new Error("checkout-indisponivel");
      }

      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("sem-url");
    } catch {
      setError("Checkout ainda será ativado na etapa de pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.ctaWrapper}>
      <button
        type="button"
        className={styles.cta}
        onClick={handleClick}
        disabled={loading}
        data-cta-id={ctaId}
      >
        {loading ? "Redirecionando…" : children}
      </button>
      {error && (
        <p className={styles.ctaError} role="status">
          {error}
        </p>
      )}
    </div>
  );
}
