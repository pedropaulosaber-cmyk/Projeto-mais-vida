import { getStripe } from "@/lib/stripe";
import { formatBRL } from "@/lib/format";
import { getDriveFolderUrl } from "@/lib/drive";
import { CopyLinkButton } from "@/components/CopyLinkButton";

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

  // Se DRIVE_FOLDER_ID não estiver configurado, degrada silenciosamente
  // (não mostra o bloco de link) em vez de derrubar a página inteira.
  let driveUrl: string | null = null;
  if (status === "paid") {
    try {
      driveUrl = getDriveFolderUrl();
    } catch {
      driveUrl = null;
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

          {driveUrl && (
            <div
              style={{
                marginTop: 24,
                padding: 20,
                border: "1px solid #eee",
                borderRadius: 12,
                background: "#FAFAFA",
              }}
            >
              <p style={{ fontWeight: 700, margin: "0 0 10px" }}>
                Prefere acessar direto por aqui?
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  wordBreak: "break-all",
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: "0 0 12px",
                }}
              >
                {driveUrl}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#FFC107",
                    color: "#1A1A1A",
                    fontWeight: 800,
                    fontSize: 13,
                    textDecoration: "none",
                    padding: "9px 16px",
                    borderRadius: 8,
                  }}
                >
                  Acessar agora
                </a>
                <CopyLinkButton url={driveUrl} />
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "12px 0 0" }}>
                O acesso só abre para o e-mail usado na compra (
                {email ?? "o seu"}) — pode levar alguns minutos após o
                pagamento para ser liberado.
              </p>
            </div>
          )}
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
