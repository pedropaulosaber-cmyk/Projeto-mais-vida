import styles from "./landing.module.css";
import { OFFER, formatBRL } from "@/lib/offer";

/*
 * Comparação de valor (prompt §5 — seção obrigatória): 1 ebook avulso (faixa
 * realista de mercado, R$ 30–50) vs. acesso completo ao EbookDrive (R$ 39,90 por
 * vários títulos). Números são estimativa genérica de mercado — NÃO citar fonte.
 */
export function ComparacaoValor() {
  return (
    <section className={styles.section} id="comparacao">
      <div className={styles.wrap}>
        <h2 className={styles.sectionTitle}>Compare e veja a diferença</h2>
        <p className={styles.compareIntro}>
          Comprando avulso, cada ebook sai por um preço cheio. No EbookDrive, um
          único pagamento libera a pasta completa.
        </p>

        <div className={styles.compareGrid}>
          <div className={styles.compareCard}>
            <p className={styles.compareTitle}>1 ebook avulso</p>
            <p className={styles.comparePrice}>R$ 30 a R$ 50</p>
            <p className={styles.compareDesc}>
              Preço médio de um único título em lojas digitais — e você paga isso
              a cada novo ebook.
            </p>
          </div>

          <div
            className={`${styles.compareCard} ${styles.compareCardHighlight}`}
          >
            <p className={styles.compareTitle}>Acesso completo EbookDrive</p>
            <p className={styles.comparePrice}>{formatBRL(OFFER.priceCents)}</p>
            <p className={styles.compareDesc}>
              Vários ebooks reunidos em uma pasta, por um pagamento único — muito
              menos por título do que comprar separado.
            </p>
          </div>
        </div>

        <p className={styles.estimateNote}>
          * Valores de mercado apresentados como estimativa genérica, apenas para
          comparação — não representam o preço de uma loja específica.
        </p>
      </div>
    </section>
  );
}
