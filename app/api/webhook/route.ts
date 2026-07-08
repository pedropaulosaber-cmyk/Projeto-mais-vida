import { NextResponse } from "next/server";

/*
 * POST /api/webhook — ESQUELETO (Etapa 1). A ÚNICA fonte de verdade do pagamento.
 *
 * Responsabilidade (skill stripe-drive-checkout, Passo 3):
 *   1. Validar a assinatura do Stripe com STRIPE_WEBHOOK_SECRET (body CRU).
 *      Nenhum acesso é liberado sem essa validação.
 *   2. No evento `checkout.session.completed`:
 *        - registrar a venda (lib/db.ts) de forma IDEMPOTENTE (session.id único)
 *        - liberar acesso ao Drive por e-mail do comprador (lib/drive.ts —
 *          entrega Opção B: permissions.create role:reader)
 *        - enviar o e-mail de entrega instantâneo (lib/email.ts)
 *        - registrar o evento `purchase` server-side (conversion-tracking)
 *
 * CRÍTICO no Next.js App Router: o corpo precisa ser lido CRU (await req.text())
 * para a verificação de assinatura funcionar. Runtime Node obrigatório.
 */
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Não implementado — esqueleto (Etapa 1)." },
    { status: 501 },
  );
}
