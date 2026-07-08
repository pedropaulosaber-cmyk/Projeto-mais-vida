/*
 * Cliente Stripe configurado — ESQUELETO (Etapa 1).
 *
 * Centraliza a criação do cliente para que checkout e webhook usem a MESMA
 * instância/versão de API. A secret key só existe no server (lib server-only).
 * A implementação real (import Stripe from "stripe"; new Stripe(...)) entra na
 * etapa da skill stripe-drive-checkout — mantido como stub para não exigir a
 * chave durante o esqueleto.
 */
import "server-only";
import { requireEnv } from "./env";

export function getStripeSecretKey(): string {
  return requireEnv("STRIPE_SECRET_KEY");
}

// Placeholder do cliente. Será substituído por:
//   import Stripe from "stripe";
//   export const stripe = new Stripe(getStripeSecretKey());
export const stripe = null;
