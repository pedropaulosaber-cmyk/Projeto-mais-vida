import styles from "./landing.module.css";
import { CheckoutButton } from "./CheckoutButton";
import { OFFER, formatBRL, discountPercent } from "@/lib/offer";

/* Fechamento com CTA final (reforço da oferta). */
export function CtaFinal() {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <div className={styles.ctaFinal}>
          <h2 className={styles.ctaFinalTitle}>
            Comece a ler agora mesmo
          </h2>
          <p className={styles.ctaFinalText}>
            Um pagamento único de {formatBRL(OFFER.priceCents)} (
            {discountPercent()}% OFF) e a biblioteca completa é sua, com acesso
            imediato.
          </p>
          <div className={styles.ctaFinalInner}>
            <CheckoutButton ctaId="final">Quero meu acesso agora</CheckoutButton>
          </div>
        </div>
      </div>
    </section>
  );
}
