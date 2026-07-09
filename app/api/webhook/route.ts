import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { requireEnv } from "@/lib/env";
import { recordSaleIdempotent, recordEvent } from "@/lib/db";
import { grantFolderAccess, revokeFolderAccess } from "@/lib/drive";
import { sendDeliveryEmail } from "@/lib/email";
import { formatBRL } from "@/lib/format";
import { PRODUCT_METADATA_VALUE } from "@/lib/product";

/*
 * POST /api/webhook — a ÚNICA fonte de verdade do pagamento (skill
 * stripe-drive-checkout, Passo 3). Nenhum acesso é liberado sem passar por
 * aqui, e sem a assinatura do Stripe ser validada primeiro.
 *
 * CRÍTICO: o corpo precisa ser lido CRU (req.text(), não req.json()) — a
 * verificação de assinatura falha se o corpo já tiver sido parseado/reserializado.
 *
 * IMPORTANTE se a mesma conta Stripe processar outros produtos/projetos: um
 * endpoint de webhook cadastrado para `checkout.session.completed` recebe esse
 * evento para TODAS as compras da conta, não só as deste site. Por isso
 * ignoramos qualquer sessão cujo metadata.produto não seja o deste produto —
 * senão liberaríamos acesso ao Drive para compras de outro produto.
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (err) {
    console.error("[webhook] assinatura inválida:", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.produto !== PRODUCT_METADATA_VALUE) {
      // Compra de outro produto/projeto na mesma conta Stripe — não é deste
      // site, então não liberamos acesso ao Drive nem enviamos e-mail.
      return NextResponse.json({ received: true });
    }

    const buyerEmail = session.customer_details?.email;
    const amountCents = session.amount_total ?? 0;
    const currency = session.currency ?? "brl";

    if (!buyerEmail) {
      console.error("[webhook] sessão sem e-mail do comprador:", session.id);
      return NextResponse.json({ received: true });
    }

    const isNewSale = await recordSaleIdempotent({
      stripeSessionId: session.id,
      buyerEmail,
      amountCents,
      currency,
    });

    if (isNewSale) {
      // Efeitos colaterais só rodam na PRIMEIRA vez que este evento é processado
      // (o Stripe pode reenviar o mesmo evento — sem isso duplicaríamos o
      // convite do Drive e o e-mail de entrega).
      await grantFolderAccess(buyerEmail);
      await sendDeliveryEmail({
        to: buyerEmail,
        amountPaidFormatted: formatBRL(amountCents),
      });
      await recordEvent("purchase", {
        sessionId: session.id,
        amountCents,
        currency,
      }).catch((err) => {
        // Registro de evento é só para o painel admin — falha aqui não deve
        // impedir a resposta 200 ao Stripe (o acesso já foi liberado).
        console.error("[webhook] falha ao registrar evento purchase:", err);
      });
    }
  }

  if (event.type === "charge.dispute.created") {
    // Chargeback/contestação (skill fraud-prevention, Passo 4): revoga o acesso
    // ao Drive automaticamente e registra o caso para follow-up. O evento chega
    // para TODA a conta Stripe (compartilhada), então filtramos pelo mesmo
    // metadata.produto — que propagamos para o PaymentIntent no checkout.
    const dispute = event.data.object as Stripe.Dispute;
    const chargeId =
      typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;

    const charge = await getStripe().charges.retrieve(chargeId, {
      expand: ["payment_intent"],
    });

    const paymentIntent = charge.payment_intent;
    const produto =
      typeof paymentIntent === "object" && paymentIntent
        ? paymentIntent.metadata?.produto
        : undefined;

    if (produto !== PRODUCT_METADATA_VALUE) {
      return NextResponse.json({ received: true });
    }

    const buyerEmail =
      charge.billing_details?.email ?? charge.receipt_email ?? undefined;

    if (buyerEmail) {
      await revokeFolderAccess(buyerEmail);
    } else {
      console.error("[webhook] disputa sem e-mail do comprador:", dispute.id);
    }

    await recordEvent("chargeback", {
      disputeId: dispute.id,
      chargeId,
      amountCents: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      buyerEmail: buyerEmail ?? null,
    }).catch((err) => {
      console.error("[webhook] falha ao registrar evento chargeback:", err);
    });
  }

  return NextResponse.json({ received: true });
}
