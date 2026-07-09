/*
 * Layout compartilhado das páginas legais (/termos, /privacidade, /reembolso)
 * — evita repetir o mesmo cabeçalho/tipografia em cada uma.
 */
export function LegalPageLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 20px 80px",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#1A1A1A",
      }}
    >
      <a
        href="/"
        style={{
          display: "inline-block",
          marginBottom: 24,
          fontSize: 13,
          color: "#6b7280",
          textDecoration: "none",
        }}
      >
        ← Voltar para a DriveBooks
      </a>
      <h1
        style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: "clamp(24px, 4vw, 32px)",
          margin: "0 0 6px",
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 32px" }}>
        Última atualização: {updatedAt}
      </p>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: "#2D2D2D" }}>
        {children}
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: 18,
          margin: "0 0 10px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
