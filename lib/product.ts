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
