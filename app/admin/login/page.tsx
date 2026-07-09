"use client";

import { useState } from "react";

/* Tela de login do painel admin — pede o e-mail e dispara o magic link. */
export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
        {sent ? (
          <p style={{ color: "#4b4b4b", lineHeight: 1.6, fontSize: 14 }}>
            Se este e-mail tiver acesso, enviamos um link de login para ele.
            Confira sua caixa de entrada — o link expira em 15 minutos.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 16px" }}>
              Digite seu e-mail de administrador para receber um link de acesso.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e5e5e5",
                borderRadius: 10,
                fontSize: 14,
                marginBottom: 14,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#FFC107",
                color: "#1A1A1A",
                fontWeight: 800,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              {loading ? "Enviando…" : "Receber link de acesso"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
