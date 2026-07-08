"use client";

import { useState } from "react";

/* Botão simples de copiar o link do Drive na página de obrigado. */
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
        border: "1px solid #e5e5e5",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "Inter, system-ui, sans-serif",
        background: copied ? "#FFF6D6" : "#fff",
        cursor: "pointer",
      }}
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
