/*
 * Página pós-compra ("obrigado") — ESQUELETO (Etapa 1).
 *
 * Contrato (skill stripe-drive-checkout, Passo 4): esta página recebe
 * ?session_id={CHECKOUT_SESSION_ID} e CONSULTA o status real via
 * stripe.checkout.sessions.retrieve no server — NUNCA assume que houve
 * pagamento só porque o usuário chegou nesta URL (ela pode ser aberta
 * manualmente). A liberação de acesso ao Drive acontece no webhook, não aqui;
 * esta página apenas confirma visualmente e reforça que o e-mail foi enviado.
 */

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <main className="container" style={{ paddingBlock: "48px" }}>
      <h1>Obrigado pela compra! 🎉</h1>
      <p style={{ color: "var(--color-text-muted)", maxWidth: "60ch" }}>
        Esqueleto da página de confirmação. Na etapa de checkout, aqui será
        consultado o status da sessão{" "}
        <code>{session_id ?? "(sem session_id)"}</code> via Stripe e exibida a
        confirmação real, junto do aviso de que o acesso foi enviado por e-mail.
      </p>
    </main>
  );
}
