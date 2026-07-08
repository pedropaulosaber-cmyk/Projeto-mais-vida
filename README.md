# DriveBooks

Landing page de alta conversão para **DriveBooks** — acesso a uma biblioteca de
livros digitais no Google Drive, vendido por pagamento único via Stripe.

> Estado atual: landing (design do usuário) + **checkout Stripe → Google Drive
> (Opção B) → e-mail de entrega** implementados de ponta a ponta. Faltam:
> conversion-tracking, painel admin, content-protection, fraud-prevention,
> legal-compliance, email-automation, qa-bug-hunter.

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
│   ├── stripe.ts               → cliente Stripe (singleton)
│   ├── drive.ts                → Google Drive API — grant/revoke individual (Opção B)
│   ├── email.ts                → e-mail de entrega (Resend)
│   ├── db.ts                   → Postgres: idempotência de vendas + eventos (painel admin)
│   ├── format.ts                → formatação de moeda (BRL)
│   └── rate-limit.ts           → rate limiting das rotas de API
├── db/schema.sql               → tabelas sales + events (rodar 1x no Postgres)
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

1. **Landing** (`app/page.tsx` + `components/LandingClient.tsx`) só chama
   `POST /api/checkout` e redireciona — nunca fala direto com o Stripe. Se
   `NEXT_PUBLIC_CHECKOUT_URL` estiver definido, os CTAs vão direto para essa URL
   (link de pagamento externo) em vez de passar por `/api/checkout`.
2. **`/api/checkout`** cria a Stripe Checkout Session a partir de
   `STRIPE_PRICE_ID` (preço em um único lugar) — rate limited por IP.
3. **`/api/webhook`** é a **única fonte de verdade**: valida a assinatura do
   Stripe, registra a venda de forma idempotente em `sales` (Postgres), concede
   acesso individual à pasta do Drive (`grantFolderAccess`) e envia o e-mail de
   entrega — tudo isso só na primeira vez que o evento é processado.
4. **`/obrigado`** consulta `stripe.checkout.sessions.retrieve` no server —
   nunca confia só no redirecionamento — para mostrar a confirmação real.
5. **Tracking** (etapa futura) injeta snippets no `layout.tsx` (client) e
   registra `purchase` server-side dentro do webhook.

## Rodando localmente

```bash
cp .env.example .env.local   # preencha as chaves
npm install
npm run dev                  # http://localhost:3000
npm run typecheck            # checagem de tipos
```

Segredos ficam só em `.env.local` / variáveis de ambiente da Vercel — nunca no
código versionado nem no bundle do frontend (só `NEXT_PUBLIC_*` vai ao navegador).

### Configuração necessária antes do checkout funcionar de ponta a ponta

1. **Stripe**: crie um Price no Dashboard (R$ 39,90, pagamento único) → `STRIPE_PRICE_ID`.
   Pegue `STRIPE_SECRET_KEY` e, ao configurar o endpoint de webhook
   (`/api/webhook`), o `STRIPE_WEBHOOK_SECRET`. Teste local com
   `stripe listen --forward-to localhost:3000/api/webhook`.
2. **Google Drive**: crie uma Service Account no Google Cloud com a Drive API
   ativada, compartilhe a pasta mestre com o e-mail da Service Account como
   Editor → `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON em uma linha) e `DRIVE_FOLDER_ID`.
3. **E-mail**: conta no Resend → `EMAIL_API_KEY`, `EMAIL_FROM`, `SUPPORT_EMAIL`.
4. **Banco**: Postgres (Supabase/Vercel Postgres) → `DATABASE_URL`, depois rode
   `db/schema.sql` uma vez para criar as tabelas `sales` e `events`.

Sem essas chaves, as rotas continuam de pé mas retornam erro amigável (502 no
checkout, por exemplo) em vez de derrubar o servidor.

## Segurança (prompt §8) — já ancorado na arquitetura

- Cabeçalhos de segurança em `next.config.mjs` (CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Chaves secretas apenas server-side; módulos de `lib/` marcados `server-only`.
- Rate limiting disponível para as rotas de API (`lib/rate-limit.ts`).
- Webhook validando assinatura como pré-condição para liberar acesso.
- Acesso ao Drive individual e **revogável** (suporta reembolso/chargeback e
  proteção de conteúdo).
