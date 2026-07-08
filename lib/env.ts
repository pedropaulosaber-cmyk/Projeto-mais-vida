/*
 * Validação centralizada de variáveis de ambiente.
 *
 * Objetivo de arquitetura: falhar cedo e de forma clara quando um segredo estiver
 * faltando, em vez de estourar em runtime no meio do checkout. Cada módulo (stripe,
 * drive, email, db) lê daqui. Segredos NUNCA têm prefixo NEXT_PUBLIC_.
 *
 * Nesta Etapa 1 (esqueleto), a validação é "preguiçosa": só exigimos a variável
 * quando o módulo correspondente for realmente usado (via requireEnv), para o
 * projeto conseguir rodar/buildar sem todas as chaves configuradas ainda.
 */

export function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Configure-a em .env.local (ver .env.example).`,
    );
  }
  return value;
}
