/*
 * Painel administrativo — ESQUELETO (Etapa 1). Prompt §9.
 *
 * IMPORTANTE (segurança): esta rota NUNCA pode ser pública. A proteção real
 * (magic link / sessão assinada com ADMIN_SESSION_SECRET, restrita a
 * ADMIN_ALLOWED_EMAILS) será implementada na etapa do painel admin, provavelmente
 * via middleware.ts + verificação de sessão no server. Este placeholder não
 * expõe nenhum dado — apenas fixa o lugar da rota.
 *
 * Métricas que este painel exibirá (a partir de lib/db.ts + conversion-tracking):
 *   - visitantes/sessões por período
 *   - taxa de conversão (visitantes → compras)
 *   - origem/UTM dos acessos
 *   - cliques por CTA
 *   - tempo médio de permanência
 *   - vendas confirmadas (data + valor)
 */

export default function AdminPage() {
  return (
    <main className="container" style={{ paddingBlock: "48px" }}>
      <h1>Admin — EbookDrive</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Esqueleto. A autenticação forte e os painéis de métricas entram na etapa
        do painel administrativo. Rota protegida — nunca acessível sem login.
      </p>
    </main>
  );
}
