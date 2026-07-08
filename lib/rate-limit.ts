/*
 * Rate limiting — ESQUELETO funcional (Etapa 1). Prompt §8.
 *
 * Implementação simples em memória (janela fixa) para as rotas de API sensíveis
 * (checkout, formulários). Suficiente para uma única instância; em produção
 * serverless com múltiplas instâncias, trocar por um store compartilhado
 * (ex: @upstash/ratelimit + Redis) na etapa de segurança. A interface é mantida
 * estável para essa troca ser transparente.
 */
import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key identificador do cliente (ex: IP + rota)
 * @param limit número máximo de requisições na janela
 * @param windowMs tamanho da janela em ms
 */
export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
