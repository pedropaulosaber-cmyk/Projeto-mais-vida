import styles from "./landing.module.css";

/*
 * Rodapé. Os links legais (Termos, Privacidade, Reembolso) são placeholders —
 * os documentos e páginas reais entram na etapa da skill legal-compliance (LGPD).
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`${styles.wrap} ${styles.footerInner}`}>
        <p className={styles.footerBrand}>EbookDrive</p>
        <nav className={styles.footerLinks} aria-label="Links legais">
          {/* TODO(legal-compliance): páginas reais de Termos, Privacidade e Reembolso. */}
          <a href="/termos">Termos de Uso</a>
          <a href="/privacidade">Política de Privacidade</a>
          <a href="/reembolso">Política de Reembolso</a>
        </nav>
        <p className={styles.footerNote}>
          © {year} EbookDrive. Acesso a conteúdo digital para uso pessoal.
        </p>
      </div>
    </footer>
  );
}
