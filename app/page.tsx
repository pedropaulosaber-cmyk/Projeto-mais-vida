/*
 * Landing page — ESQUELETO (Etapa 1: arquitetura).
 *
 * O conteúdo real (hero, oferta, comparação de valor, benefícios, FAQ) será
 * construído na etapa da skill `ebook-landing-page`, quebrando cada seção em
 * componentes dentro de /components. Este placeholder existe apenas para o
 * esqueleto rodar e para fixar o contrato: o botão de compra chama
 * POST /api/checkout e redireciona — NUNCA fala direto com o Stripe.
 */

export default function HomePage() {
  return (
    <main>
      <section className="container" style={{ paddingBlock: "48px" }}>
        <p
          style={{
            display: "inline-block",
            background: "var(--color-accent-soft)",
            border: "1px solid var(--color-accent)",
            borderRadius: "999px",
            padding: "4px 12px",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          Esqueleto — Etapa 1 (arquitetura)
        </p>

        <h1 style={{ fontSize: "1.9rem", lineHeight: 1.2, margin: "0 0 12px" }}>
          EbookDrive
        </h1>
        <p style={{ color: "var(--color-text-muted)", maxWidth: "60ch" }}>
          Estrutura do projeto criada. As seções da landing page (hero com mockup
          de vários ebooks, oferta R$ 89,90 → R$ 39,90, comparação de valor,
          benefícios) entram na próxima etapa, com a skill{" "}
          <strong>ebook-landing-page</strong>.
        </p>

        <div style={{ marginTop: "24px", maxWidth: "360px" }}>
          {/*
            Placeholder do CTA. Na etapa de checkout este botão dispara
            handleBuy() → fetch('/api/checkout') → window.location = url.
          */}
          <button className="btn-cta" type="button" disabled aria-disabled>
            Quero meu acesso agora
          </button>
        </div>
      </section>
    </main>
  );
}
