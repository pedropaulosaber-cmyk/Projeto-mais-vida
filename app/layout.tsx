import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MetaPixel } from "@/components/MetaPixel";

// SEO base (skill: seo-content refina isto na etapa correspondente — title/description
// finais, Open Graph, JSON-LD serão adicionados lá).
export const metadata: Metadata = {
  title: "DriveBooks — +1.500 livros digitais por R$ 39,90",
  description:
    "Uma biblioteca completa com mais de 1.500 livros digitais via Google Drive. Acesso vitalício, entrega imediata e leitura em qualquer dispositivo — pagamento único de R$ 39,90.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

// Mobile-first: viewport correto para telas pequenas (prioridade absoluta).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFC107",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Meta Pixel — só ativa se NEXT_PUBLIC_META_PIXEL_ID estiver definido. */}
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
