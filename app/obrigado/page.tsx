import type { Metadata } from "next";
import { getStripe } from "@/lib/stripe";
import { formatBRL } from "@/lib/format";
import { getDriveFolderUrl } from "@/lib/drive";
import { CopyLinkButton } from "@/components/CopyLinkButton";

/*
 * Página pós-compra (skill stripe-drive-checkout, Passo 4) — a tela mais
 * importante do funil: é onde o cliente recebe o produto que pagou.
 *
 * É uma rota própria e persistente: o Stripe redireciona para
 * /obrigado?session_id=... . Consulta o status REAL da sessão via
 * stripe.checkout.sessions.retrieve — nunca assume pagamento só porque o
 * usuário chegou nesta URL. Como o session_id fica na URL, recarregar a
 * página mantém o acesso (não é estado de SPA que se perde no reload).
 * A liberação de acesso ao Drive acontece no webhook; aqui só confirmamos e
 * entregamos o link.
 */
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Acesso liberado — DriveBooks",
  robots: { index: false, follow: false },
};

const DBK_LOGO = (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ flex: "none", display: "block" }}
  >
    <rect width="24" height="24" rx="7" fill="#FFC107" />
    <path
      d="M12 7.2C10.5 6.2 8.2 5.8 6 6.3V17.2C8.2 16.7 10.5 17.1 12 18.1C13.5 17.1 15.8 16.7 18 17.2V6.3C15.8 5.8 13.5 6.2 12 7.2Z"
      fill="#1A1A1A"
    />
    <path d="M12 7.2V18.1" stroke="#FFC107" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

function Brand() {
  return (
    <div style={S.brand}>
      {DBK_LOGO}
      <span style={S.brandText}>DriveBooks</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={S.main}>
      <div style={S.card}>{children}</div>
    </main>
  );
}

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

  let driveUrl: string | null = null;
  if (status === "paid") {
    try {
      driveUrl = getDriveFolderUrl();
    } catch {
      driveUrl = null;
    }
  }

  /* ---------- Pagamento confirmado ---------- */
  if (status === "paid") {
    return (
      <Shell>
        <Brand />

        <div style={S.checkWrap}>
          <div style={S.checkCircle}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h1 style={S.h1}>Pagamento confirmado! 🎉</h1>
        <p style={S.sub}>
          Sua biblioteca com mais de 1.500 livros já está liberada
          {amountFormatted ? (
            <>
              . Recebemos seu pagamento de <strong>{amountFormatted}</strong>
            </>
          ) : null}
          .
        </p>

        {driveUrl ? (
          <div style={S.deliveryBox}>
            <div style={S.deliveryLabel}>Sua biblioteca DriveBooks</div>
            <a href={driveUrl} target="_blank" rel="noopener noreferrer" style={S.primaryBtn}>
              📂 Acessar a biblioteca agora
            </a>
            <div style={S.linkRow}>{driveUrl}</div>
            <CopyLinkButton url={driveUrl} />
          </div>
        ) : null}

        <div style={S.infoBox}>
          <p style={S.infoLine}>
            ✉️ Também enviamos o acesso para{" "}
            <strong>{email ?? "o e-mail usado na compra"}</strong> — confira sua
            caixa de entrada (e o spam).
          </p>
          <p style={S.infoLine}>
            🔒 O acesso é <strong>vitalício</strong> e vinculado a esse e-mail. Se
            o Google pedir login ao abrir o Drive, entre com ele.
          </p>
          <p style={S.tip}>
            💡 Dica: salve esta página ou o link nos seus favoritos para voltar
            quando quiser.
          </p>
        </div>

        <p style={S.support}>
          Precisa de ajuda? Fale com a gente:{" "}
          <a href="mailto:adminebook.16@gmail.com" style={S.supportLink}>
            adminebook.16@gmail.com
          </a>
        </p>
      </Shell>
    );
  }

  /* ---------- Pagamento em processamento ---------- */
  if (status === "pending") {
    return (
      <Shell>
        <Brand />
        <div style={S.checkWrap}>
          <div style={{ ...S.checkCircle, background: "#FFC107" }}>
            <span style={{ fontSize: 30 }}>⏳</span>
          </div>
        </div>
        <h1 style={S.h1}>Pagamento em processamento…</h1>
        <p style={S.sub}>
          Assim que a confirmação chegar, o acesso é liberado automaticamente —
          aqui e no seu e-mail, normalmente em poucos minutos. Pode atualizar
          esta página em instantes.
        </p>
        <p style={S.support}>
          Qualquer dúvida:{" "}
          <a href="mailto:adminebook.16@gmail.com" style={S.supportLink}>
            adminebook.16@gmail.com
          </a>
        </p>
      </Shell>
    );
  }

  /* ---------- Sessão inválida ---------- */
  return (
    <Shell>
      <Brand />
      <div style={S.checkWrap}>
        <div style={{ ...S.checkCircle, background: "#E5E5E5" }}>
          <span style={{ fontSize: 30 }}>🔎</span>
        </div>
      </div>
      <h1 style={S.h1}>Não encontramos essa compra</h1>
      <p style={S.sub}>
        Se você concluiu um pagamento, verifique seu e-mail — o acesso é enviado
        automaticamente assim que a confirmação é processada. Se acha que é um
        engano, fale com a gente.
      </p>
      <a href="/" style={S.secondaryLink}>
        ← Voltar para a DriveBooks
      </a>
      <p style={S.support}>
        Suporte:{" "}
        <a href="mailto:adminebook.16@gmail.com" style={S.supportLink}>
          adminebook.16@gmail.com
        </a>
      </p>
    </Shell>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 18px",
    background:
      "radial-gradient(1200px 600px at 50% -10%, #FFF3CC 0%, transparent 55%), #FAF8F3",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    border: "1px solid #f0ece3",
    borderRadius: 24,
    padding: "32px clamp(20px, 5vw, 40px) 28px",
    textAlign: "center",
    boxShadow: "0 30px 80px -40px rgba(0,0,0,.35)",
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },
  brandText: {
    fontFamily: "Poppins, sans-serif",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-.01em",
    color: "#1A1A1A",
  },
  checkWrap: { display: "flex", justifyContent: "center", marginBottom: 18 },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "#12B76A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 26px -10px rgba(18,183,106,.6)",
  },
  h1: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "clamp(23px, 5vw, 28px)",
    fontWeight: 800,
    color: "#1A1A1A",
    margin: "0 0 10px",
    letterSpacing: "-.02em",
  },
  sub: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#4b4b4b",
    margin: "0 auto 24px",
    maxWidth: 420,
  },
  deliveryBox: {
    background: "#FFFBEB",
    border: "1.5px solid #FCE9A8",
    borderRadius: 18,
    padding: "20px 18px",
    margin: "0 0 20px",
  },
  deliveryLabel: {
    fontFamily: "Poppins, sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: "#8a6d00",
    textTransform: "uppercase",
    letterSpacing: ".06em",
    marginBottom: 14,
  },
  primaryBtn: {
    display: "block",
    width: "100%",
    background: "#FFC107",
    color: "#1A1A1A",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 800,
    fontSize: 17,
    textDecoration: "none",
    padding: "17px",
    borderRadius: 14,
    boxShadow: "0 12px 26px -12px rgba(255,193,7,.9)",
    marginBottom: 12,
  },
  linkRow: {
    fontSize: 12.5,
    color: "#6b7280",
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 12,
    wordBreak: "break-all",
  },
  infoBox: {
    textAlign: "left",
    background: "#FAFAFA",
    border: "1px solid #f0f0f0",
    borderRadius: 14,
    padding: "16px 16px 6px",
    marginBottom: 18,
  },
  infoLine: { fontSize: 13.5, lineHeight: 1.55, color: "#4b4b4b", margin: "0 0 10px" },
  tip: { fontSize: 13, lineHeight: 1.55, color: "#8a6d00", margin: "0 0 10px" },
  support: { fontSize: 13, color: "#9ca3af", margin: "6px 0 0" },
  supportLink: { color: "#1A1A1A", fontWeight: 600 },
  secondaryLink: {
    display: "inline-block",
    fontSize: 14,
    fontWeight: 600,
    color: "#1A1A1A",
    textDecoration: "none",
    margin: "0 0 18px",
  },
};
