import { getStripe } from "@/lib/stripe";
import { formatBRL } from "@/lib/format";

/*
 * Página pós-compra (skill stripe-drive-checkout, Passo 4).
 *
 * Consulta o status REAL da sessão via stripe.checkout.sessions.retrieve —
 * nunca assume que houve pagamento só porque o usuário chegou nesta URL (ela
 * pode ser aberta manualmente sem pagar). A liberação de acesso ao Drive
 * acontece no webhook, não aqui; esta página só confirma visualmente.
 */
export const runtime = "nodejs";

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let status: "paid" | "pending" | "invalid" = "invalid";
  let email: string | null = null;
  let amountFormatted: string | null = null;

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      email = session.customer_details?.email ?? null;
      amountFormatted =
        session.amount_total != null ? formatBRL(session.amount_total) : null;
      status = session.payment_status === "paid" ? "paid" : "pending";
    } catch {
      status = "invalid";
    }
  }

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "48px 20px",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      {status === "paid" && (
        <>
          <h1 style={{ fontFamily: "Poppins, sans-serif" }}>
            Pagamento confirmado! 🎉
          </h1>
          <p style={{ color: "#4b4b4b", lineHeight: 1.6 }}>
            {amountFormatted && (
              <>
                Recebemos seu pagamento de <strong>{amountFormatted}</strong>.
                <br />
              </>
            )}
            Enviamos o acesso à biblioteca para{" "}
            <strong>{email ?? "o e-mail usado na compra"}</strong>. Confira sua
            caixa de entrada (e o spam) — o convite do Google Drive e o e-mail
            de confirmação chegam em poucos minutos.
          </p>
        </>
      )}

      {status === "pending" && (
        <>
          <h1 style={{ fontFamily: "Poppins, sans-serif" }}>
            Pagamento em processamento…
          </h1>
          <p style={{ color: "#4b4b4b", lineHeight: 1.6 }}>
            Assim que a confirmação chegar, o acesso é liberado automaticamente
            por e-mail — normalmente em poucos minutos.
          </p>
        </>
      )}

      {status === "invalid" && (
        <>
          <h1 style={{ fontFamily: "Poppins, sans-serif" }}>
            Não encontramos essa compra
          </h1>
          <p style={{ color: "#4b4b4b", lineHeight: 1.6 }}>
            Se você concluiu um pagamento, verifique seu e-mail — o acesso é
            enviado automaticamente assim que a confirmação é processada.
          </p>
        </>
      )}
    </main>
  );
}
