import styles from "./landing.module.css";

/*
 * Mockup do hero — leque de vários ebooks (skill ebook-cover-design, Opção B:
 * CSS 3D transform). Transmite "biblioteca completa", não um produto isolado (§3).
 *
 * PLACEHOLDER: capas neutras geradas por CSS. Devem ser SUBSTITUÍDAS pelas capas
 * reais assim que existirem — troque cada item por uma imagem (background-image
 * da capa 2D) mantendo o efeito de leque. Ver README / skill ebook-cover-design.
 */

const PLACEHOLDER_BOOKS = [
  { label: "Finanças", tone: "a" },
  { label: "Produtividade", tone: "b" },
  { label: "Marketing", tone: "c" },
  { label: "Saúde", tone: "d" },
  { label: "Carreira", tone: "e" },
];

export function BookStack() {
  return (
    <div
      className={styles.bookStack}
      role="img"
      aria-label="Composição com vários ebooks representando a biblioteca completa (imagens ilustrativas)"
    >
      {PLACEHOLDER_BOOKS.map((book, i) => (
        <div
          key={book.label}
          className={styles.book}
          data-tone={book.tone}
          style={{ ["--i" as string]: i, ["--n" as string]: PLACEHOLDER_BOOKS.length }}
        >
          <span className={styles.bookBand} />
          <span className={styles.bookLabel}>{book.label}</span>
          <span className={styles.bookPlaceholderTag}>capa ilustrativa</span>
        </div>
      ))}
    </div>
  );
}
