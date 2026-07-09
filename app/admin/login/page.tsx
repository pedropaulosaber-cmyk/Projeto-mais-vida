"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  link: "Link inválido ou expirado.",
  tentativas: "Muitas tentativas. Aguarde um instante e tente de novo.",
};

/* Tela de login do painel admin — e-mail + senha (com magic link como alternativa). */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");

  const [useMagicLink, setUseMagicLink] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFormError(data?.error ?? "Não foi possível entrar.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        background: "#FAFAFA",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 8px 30px -20px rgba(0,0,0,.3)",
        }}
      >
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: 20, margin: "0 0 6px" }}>
          Painel DriveBooks
        </h1>

        {erro && ERROR_MESSAGES[erro] && (
          <p style={S.alert}>{ERROR_MESSAGES[erro]}</p>
        )}
        {formError && <p style={S.alert}>{formError}</p>}

        {useMagicLink ? (
          magicSent ? (
            <p style={{ color: "#4b4b4b", lineHeight: 1.6, fontSize: 14 }}>
              Se este e-mail tiver acesso, enviamos um link de login para ele.
              Confira sua caixa de entrada — o link expira em 15 minutos.
            </p>
          ) : (
            <form onSubmit={handleMagicSubmit}>
              <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 16px" }}>
                Digite seu e-mail de administrador para receber um link de acesso.
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                style={S.input}
              />
              <button type="submit" disabled={loading} style={S.button}>
                {loading ? "Enviando…" : "Receber link de acesso"}
              </button>
              <button
                type="button"
                onClick={() => setUseMagicLink(false)}
                style={S.linkButton}
              >
                Entrar com e-mail e senha
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 16px" }}>
              Entre com seu e-mail e senha de administrador.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="username"
              style={S.input}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
              style={S.input}
            />
            <button type="submit" disabled={loading} style={S.button}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => setUseMagicLink(true)}
              style={S.linkButton}
            >
              Esqueci a senha — receber link por e-mail
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  alert: {
    background: "#FDECEC",
    color: "#B42318",
    fontSize: 13,
    padding: "10px 12px",
    borderRadius: 8,
    margin: "0 0 14px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#FFC107",
    color: "#1A1A1A",
    fontWeight: 800,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  linkButton: {
    width: "100%",
    padding: "10px",
    background: "transparent",
    color: "#6b7280",
    border: "none",
    fontSize: 12,
    marginTop: 10,
    cursor: "pointer",
    textDecoration: "underline",
  },
};
