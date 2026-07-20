/*
 * Identificador do produto DriveBooks nas sessões do Stripe.
 *
 * Importante quando a mesma conta Stripe processa MAIS de um produto/projeto:
 * um webhook cadastrado para `checkout.session.completed` recebe esse evento
 * para TODAS as compras da conta, não só as deste site. Por isso o webhook
 * (app/api/webhook/route.ts) usa este valor para ignorar sessões de outros
 * produtos, em vez de liberar acesso ao Drive para qualquer pagamento confirmado.
 */
export const PRODUCT_METADATA_VALUE = "drivebooks-acesso";

/*
 * Valor cobrado, em centavos. Controlado pelo código (com override opcional
 * via env PRICE_CENTS) — o checkout monta o line item com price_data usando
 * este valor, referenciando o produto existente no Stripe para preservar
 * nome/imagem na tela de pagamento. Assim, mudar o preço é uma mudança de
 * código/deploy, sem precisar criar um novo Price no painel do Stripe.
 *
 * Padrão: R$ 24,90.
 */
export function getPriceCents(): number {
  const raw = process.env.PRICE_CENTS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2490;
}
