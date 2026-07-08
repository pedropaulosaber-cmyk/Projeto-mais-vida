import styles from "./landing.module.css";

/*
 * Benefícios (prompt §6): cobre os pontos mínimos pedidos, com redação adaptada.
 */
const BENEFITS = [
  "Diversos ebooks em um único pagamento — sem precisar comprar um por um.",
  "Preço muito abaixo do custo de comprar os títulos separadamente.",
  "Acesso imediato após o pagamento, sem espera nem liberação manual.",
  "Sem mensalidade: você paga uma vez e pronto.",
  "Leia pelo celular, tablet ou computador, a qualquer hora e lugar.",
];

export function Beneficios() {
  return (
    <section
      className={`${styles.section} ${styles.sectionMuted}`}
      id="beneficios"
    >
      <div className={styles.wrap}>
        <h2 className={styles.sectionTitle}>O que você recebe</h2>
        <ul className={styles.benefitList}>
          {BENEFITS.map((benefit) => (
            <li key={benefit} className={styles.benefitItem}>
              <span className={styles.benefitCheck} aria-hidden>
                ✓
              </span>
              <p className={styles.benefitText}>{benefit}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
