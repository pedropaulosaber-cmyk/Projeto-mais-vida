/*
 * Cliente Stripe configurado (skill stripe-drive-checkout).
 *
 * Instância única usada por /api/checkout e /api/webhook — versão de API fixa
 * para os dois lados ficarem sempre em sincronia. Secret key só existe aqui,
 * server-only, nunca chega ao bundle do client.
 */
import "server-only";
import Stripe from "stripe";
import { requireEnv } from "./env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
}
