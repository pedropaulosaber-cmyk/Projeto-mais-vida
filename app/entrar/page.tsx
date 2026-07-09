"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/*
 * Login do CLIENTE — separado do /admin/login (contas diferentes, cookies
 * diferentes). Login obrigatório antes da compra: quando ?next=checkout está
 * presente, ao logar retomamos a compra automaticamente (skip de mais um clique).
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resumeCheckoutOrGoHome() {
    if (next === "checkout") {
      try {
        const res = await fetch("/api/checkout", { method: "POST" });
        const data: { url?: string } = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        }
      } catch {
        // cai no fallback abaixo
      }
    }
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Não foi possível entrar.");
        return;
      }
      await resumeCheckoutOrGoHome();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.main}>
      <div style={S.card}>
        <h1 style={S.h1}>Entrar</h1>
        <p style={S.sub}>
          {next === "checkout"
            ? "Entre na sua conta para continuar a compra."
            : "Entre na sua conta DriveBooks."}
        </p>

        {error && <p style={S.alert}>{error}</p>}

        <form onSubmit={handleSubmit}>
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
        </form>

        <p style={S.footer}>
          Ainda não tem conta?{" "}
          <Link
            href={next ? `/criar-conta?next=${next}` : "/criar-conta"}
            style={S.link}
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    background: "#0F0F0F",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#171717",
    border: "1px solid #262626",
    borderRadius: 16,
    padding: 28,
    color: "#F5F5F5",
  },
  h1: { fontFamily: "Poppins, sans-serif", fontSize: 22, margin: "0 0 6px" },
  sub: { color: "#9ca3af", fontSize: 13, margin: "0 0 18px" },
  alert: {
    background: "#3a1414",
    color: "#ff8a8a",
    fontSize: 13,
    padding: "10px 12px",
    borderRadius: 8,
    margin: "0 0 14px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #333",
    background: "#0F0F0F",
    color: "#F5F5F5",
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
  footer: { fontSize: 13, color: "#9ca3af", marginTop: 16, textAlign: "center" },
  link: { color: "#FFC107", fontWeight: 700 },
};
