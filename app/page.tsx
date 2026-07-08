import styles from "@/components/landing.module.css";
import { Hero } from "@/components/Hero";
import { Oferta } from "@/components/Oferta";
import { ComparacaoValor } from "@/components/ComparacaoValor";
import { Beneficios } from "@/components/Beneficios";
import { CtaFinal } from "@/components/CtaFinal";
import { Footer } from "@/components/Footer";

/*
 * Landing page EbookDrive (skill ebook-landing-page — construída a partir do
 * prompt §3–6, já que a skill não foi fornecida). Mobile-first, branco/amarelo.
 *
 * Ordem das seções: hero (transformação + CTA + mockup) → oferta/preço →
 * comparação de valor → benefícios → CTA final → rodapé.
 */
export default function HomePage() {
  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.wrap}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden>
              ED
            </span>
            EbookDrive
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <Oferta />
        <ComparacaoValor />
        <Beneficios />
        <CtaFinal />
      </main>

      <Footer />
    </>
  );
}
