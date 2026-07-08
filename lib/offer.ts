/*
 * Dados da oferta para EXIBIÇÃO na landing (prompt §4).
 *
 * Fonte de verdade do valor COBRADO é o Stripe (STRIPE_PRICE_ID) — ver
 * stripe-drive-checkout. Estes valores são só para renderizar preço/desconto na
 * página e devem ser mantidos em sincronia com o Price criado no Stripe.
 */
export const OFFER = {
  originalCents: 8990, // R$ 89,90
  priceCents: 3990, // R$ 39,90
  currency: "BRL",
  oneTime: true, // pagamento único, não assinatura
} as const;

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Percentual de desconto arredondado (89,90 → 39,90 = 56% OFF). */
export function discountPercent(): number {
  return Math.round((1 - OFFER.priceCents / OFFER.originalCents) * 100);
}
