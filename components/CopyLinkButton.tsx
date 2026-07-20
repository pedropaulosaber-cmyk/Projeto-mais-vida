"use client";

import { useState } from "react";

/* Botão de copiar o link do Drive na página de obrigado (pós-compra). */
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (ex: http local sem permissão) — o link
      // continua selecionável manualmente no texto ao lado do botão.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        width: "100%",
        border: "1.5px solid #1A1A1A",
        borderRadius: 12,
        padding: "14px",
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "Poppins, Inter, system-ui, sans-serif",
        color: "#1A1A1A",
        background: copied ? "#FFF6D6" : "#fff",
        cursor: "pointer",
        transition: "background .15s ease",
      }}
    >
      {copied ? "✓ Link copiado!" : "Copiar link do Drive"}
    </button>
  );
}
