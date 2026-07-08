# EbookDrive

Landing page de alta conversão para **EbookDrive** — acesso a uma biblioteca de
ebooks no Google Drive, vendido por pagamento único via Stripe.

> Estado atual: **Etapa 1 — Arquitetura (esqueleto)**. As demais etapas seguem a
> ordem das skills instaladas e são adicionadas com validação a cada passo.

## Stack

- **Next.js (App Router) + TypeScript**, deploy na **Vercel** (recomendado pela
  skill `site-architecture`: um único projeto, landing + API no mesmo lugar, com
  as rotas server-side rodando as chaves secretas com segurança).
- **Stripe** (checkout + webhook), **Google Drive API** (entrega Opção B —
  permissão individual por e-mail), **Resend/SendGrid/Postmark** (e-mail),
  **Postgres** (Supabase/Vercel Postgres) para vendas + eventos do painel admin.

## Estrutura de pastas

```
.
├── app/
│   ├── layout.tsx              → layout raiz + SEO base + (futuro) snippets de tracking
│   ├── globals.css             → tema branco/amarelo, mobile-first
│   ├── page.tsx                → landing page (conteúdo real: skill ebook-landing-page)
│   ├── obrigado/page.tsx       → pós-compra (consulta status via Stripe)
│   ├── admin/page.tsx          → painel admin protegido (prompt §9)
│   └── api/
│       ├── checkout/route.ts   → cria a Checkout Session (server-side)
│       └── webhook/route.ts    → confirma pagamento e libera acesso (fonte de verdade)
├── lib/
│   ├── env.ts                  → validação de variáveis de ambiente
│   ├── stripe.ts               → cliente Stripe
│   ├── drive.ts                → Google Drive API (grant/revoke de acesso)
│   ├── email.ts                → e-mail de entrega + automações
│   ├── db.ts                   → vendas + eventos (painel admin)
│   └── rate-limit.ts           → rate limiting das rotas de API
├── components/
│   ├── LandingClient.tsx       → injeta o design da landing e liga os CTAs ao checkout
│   └── landingMarkup.ts        → markup do design (DriveBooks, feito no Claude Design)
├── public/books/               → capas dos livros (imagens do design)
├── public/fonts/               → Inter + Poppins self-hosted (woff2)
├── next.config.mjs             → cabeçalhos de segurança (CSP, HSTS, X-Frame-Options...)
├── .env.example                → todas as chaves necessárias (sem valores)
└── package.json
```

## Contrato entre as camadas (quem faz o quê)

1. **Landing** (`app/page.tsx` + `components/`) só chama `POST /api/checkout` e
   redireciona — nunca fala direto com o Stripe.
2. **`/api/checkout`** cria a Stripe Checkout Session a partir de
   `STRIPE_PRICE_ID` (preço em um único lugar).
3. **`/api/webhook`** é a **única fonte de verdade**: valida a assinatura,
   registra a venda (idempotente), libera o acesso ao Drive e dispara o e-mail.
4. **Tracking** injeta snippets no `layout.tsx` (client) e registra `purchase`
   server-side dentro do webhook.

## Rodando localmente

```bash
cp .env.example .env.local   # preencha as chaves
npm install
npm run dev                  # http://localhost:3000
npm run typecheck            # checagem de tipos
```

Segredos ficam só em `.env.local` / variáveis de ambiente da Vercel — nunca no
código versionado nem no bundle do frontend (só `NEXT_PUBLIC_*` vai ao navegador).

## Segurança (prompt §8) — já ancorado na arquitetura

- Cabeçalhos de segurança em `next.config.mjs` (CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Chaves secretas apenas server-side; módulos de `lib/` marcados `server-only`.
- Rate limiting disponível para as rotas de API (`lib/rate-limit.ts`).
- Webhook validando assinatura como pré-condição para liberar acesso.
- Acesso ao Drive individual e **revogável** (suporta reembolso/chargeback e
  proteção de conteúdo).
