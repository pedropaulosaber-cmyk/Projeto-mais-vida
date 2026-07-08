import type { Metadata, Viewport } from "next";
import "./globals.css";

// SEO base (skill: seo-content refina isto na etapa correspondente — title/description
// finais, Open Graph, JSON-LD serão adicionados lá).
export const metadata: Metadata = {
  title: "EbookDrive — acesso a uma biblioteca completa de ebooks",
  description:
    "Acesso imediato a diversos ebooks em um único pagamento, por uma fração do preço de comprar cada título separadamente.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

// Mobile-first: viewport correto para telas pequenas (prioridade do §2).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffc61a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/*
        Aqui entrarão os snippets client-side de tracking (GA4 / Meta Pixel) na
        etapa da skill conversion-tracking — carregados via next/script, e a CSP
        em next.config.mjs será ajustada para os domínios necessários.
      */}
      <body>{children}</body>
    </html>
  );
}
