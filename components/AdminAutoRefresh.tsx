"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/*
 * Atualiza os dados do painel admin (Server Component) a cada 30s, sem
 * recarregar a página inteira — router.refresh() só busca de novo os dados
 * do servidor e re-renderiza, mantendo scroll/estado do client intactos.
 */
export function AdminAutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
