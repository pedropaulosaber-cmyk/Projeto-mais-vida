import styles from "./landing.module.css";
import { CheckoutButton } from "./CheckoutButton";
import { OFFER, formatBRL, discountPercent } from "@/lib/offer";

/*
 * Oferta e preço (prompt §4): original riscado + preço com desconto + % OFF
 * destacado + reforço de "pagamento único, não assinatura".
 */
export function Oferta() {
  return (
    <section className={`${styles.section} ${styles.sectionMuted}`} id="oferta">
      <div className={styles.wrap}>
        <div className={styles.offerCard}>
          <div className={styles.priceRow}>
            <span className={styles.priceOriginal}>
              {formatBRL(OFFER.originalCents)}
            </span>
            <span className={styles.priceNow}>{formatBRL(OFFER.priceCents)}</span>
          </div>
          <span className={styles.discountBadge}>{discountPercent()}% OFF</span>

          <p className={styles.paymentNote}>
            Pagamento único — sem mensalidade, sem assinatura.
          </p>

          <div className={styles.offerCta}>
            <CheckoutButton ctaId="oferta">Garantir meu acesso</CheckoutButton>
          </div>

          <p className={styles.offerNote}>
            Acesso liberado automaticamente por e-mail assim que o pagamento é
            confirmado.
          </p>
        </div>
      </div>
    </section>
  );
}
