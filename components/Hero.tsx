import styles from "./landing.module.css";
import { BookStack } from "./BookStack";
import { CheckoutButton } from "./CheckoutButton";
import { OFFER, formatBRL, discountPercent } from "@/lib/offer";

/*
 * Hero (prompt §3): headline de transformação, CTA em amarelo já visível na
 * primeira dobra, e mockup de VÁRIOS ebooks (biblioteca completa).
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.wrap}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Acesso imediato · pagamento único</span>
          <h1 className={styles.title}>
            Uma <span className={styles.titleHighlight}>biblioteca inteira</span>{" "}
            de ebooks por uma fração do preço de comprar um por um
          </h1>
          <p className={styles.subtitle}>
            Destrave o acesso imediato a diversos ebooks reunidos em uma única
            pasta do Google Drive — sem assinatura, sem comprar título por título.
            Pague uma vez e leia no celular, tablet ou computador.
          </p>

          <div className={styles.heroCta}>
            <CheckoutButton ctaId="hero">Quero meu acesso agora</CheckoutButton>
            <p className={styles.heroPriceHint}>
              De {formatBRL(OFFER.originalCents)} por{" "}
              <strong>{formatBRL(OFFER.priceCents)}</strong> · {discountPercent()}% OFF
            </p>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <BookStack />
        </div>
      </div>
    </section>
  );
}
