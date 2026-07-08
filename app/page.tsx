import { LandingClient } from "@/components/LandingClient";

/*
 * Landing page DriveBooks — design feito no Claude Design pelo usuário,
 * portado fielmente (mobile-first). O markup vive em components/landingMarkup.ts
 * e os CTAs são ligados ao checkout em components/LandingClient.tsx.
 * Imagens: /public/books · Fontes (Inter/Poppins) self-hosted: /public/fonts.
 */
export default function HomePage() {
  return <LandingClient />;
}
