---
name: site-architecture
description: "Use esta skill sempre que o usuário for iniciar o projeto do zero ou precisar decidir/organizar a arquitetura técnica do site de venda de ebooks: qual stack usar, estrutura de pastas, onde vai rodar o backend do checkout/webhook, variáveis de ambiente, e onde hospedar. Gatilhos: 'arquitetura', 'estrutura do projeto', 'estrutura de pastas', 'que tecnologia usar', 'stack', 'onde hospedar', 'monorepo', 'como organizar o código', 'setup inicial do projeto'. Use esta skill ANTES das outras (ebook-landing-page, stripe-drive-checkout, qa-bug-hunter, conversion-tracking) quando o projeto ainda não existe — ela define o esqueleto em que as outras skills vão encaixar o trabalho delas."
---

# Site Architecture

Skill para definir e montar o esqueleto técnico do projeto: stack, estrutura de pastas, onde cada peça (landing page, checkout, webhook, tracking) vive e como se comunicam. É a skill que roda primeiro, antes de qualquer código de página ou pagamento.

## Quando usar

- Início de um projeto novo (nenhum código ainda existe).
- Quando o usuário pergunta "como devo organizar isso" ou já tem algo mas está bagunçado/confuso sobre onde colocar o quê.
- Quando surge a dúvida "isso é frontend ou backend?" no meio do desenvolvimento — volte aqui para reancorar a decisão.

## Passo 1 — O problema real de arquitetura deste projeto

Este projeto tem duas naturezas diferentes que não podem morar no mesmo lugar:

1. **Frontend estático** — a landing page em si (HTML/CSS/JS ou React). Pode ser hospedada em qualquer CDN/hosting estático.
2. **Backend com segredo** — criação da Checkout Session do Stripe, o webhook que confirma pagamento, e a liberação do acesso ao Drive. Isso PRECISA rodar em um servidor (ou função serverless), nunca no navegador, porque envolve chaves secretas (Stripe secret key, credenciais do Google) que não podem existir no código do cliente.

A decisão de arquitetura é, no fundo, decidir onde essa parte 2 vai rodar.

## Passo 2 — Escolher a stack (pergunte se não estiver claro)

**Opção recomendada por padrão — Next.js (ou similar full-stack) na Vercel:**
- Um único projeto, um único deploy.
- Páginas/landing page como rotas normais.
- `api/checkout` e `api/webhook` como API Routes (rodam server-side, variáveis de ambiente seguras).
- Mais simples de manter para quem não tem experiência com infra separada.

**Opção alternativa — Site estático + funções serverless separadas:**
- Landing page em HTML puro hospedada em qualquer lugar (Netlify, GitHub Pages, hosting próprio).
- Backend (checkout + webhook) como funções serverless independentes (Netlify Functions, Vercel Functions, Cloudflare Workers, ou um pequeno servidor Node/Express em algum host).
- Faz sentido se o usuário já tem a landing page pronta em HTML e só precisa "plugar" o pagamento.

**Opção alternativa — Servidor tradicional (Node/Express, Python/Flask):**
- Faz sentido se o usuário já tem preferência por essa stack ou precisa de mais controle (ex: lógica mais complexa, múltiplos produtos, painel administrativo).

Se o usuário não tiver preferência, recomende a primeira opção (Next.js + Vercel) por ser a mais simples de manter sozinho e ter deploy gratuito para esse porte de projeto.

## Passo 3 — Estrutura de pastas padrão (exemplo com Next.js)

```
projeto-ebooks/
├── app/ (ou pages/)
│   ├── page.tsx                 → landing page (skill: ebook-landing-page)
│   ├── obrigado/page.tsx        → página pós-compra (consulta status da session)
│   └── api/
│       ├── checkout/route.ts    → cria a Checkout Session (skill: stripe-drive-checkout)
│       └── webhook/route.ts     → recebe confirmação do Stripe (skill: stripe-drive-checkout)
├── lib/
│   ├── stripe.ts                → cliente Stripe configurado
│   ├── drive.ts                 → cliente Google Drive API (se Opção B de entrega)
│   └── email.ts                 → envio de e-mail de entrega
├── components/
│   ├── Hero.tsx, Oferta.tsx, Faq.tsx, ...   → seções da landing page
├── public/
│   └── imagens dos mockups das capas
├── .env.local                   → chaves secretas (NUNCA commitar — ver Passo 5)
├── .env.example                 → mesmas chaves sem valor, para referência
└── package.json
```

Se o projeto for site estático + funções separadas, adapte: `/landing` (estático) e `/backend` (funções) como duas pastas irmãs, cada uma com seu próprio deploy.

## Passo 4 — Contrato entre as partes (como as skills se encaixam)

1. `ebook-landing-page` constrói tudo dentro de `app/page.tsx` + `components/` — só chama `POST /api/checkout` quando o usuário clica em comprar, nunca fala diretamente com o Stripe.
2. `stripe-drive-checkout` implementa `api/checkout` (cria a Session) e `api/webhook` (confirma e libera acesso) — vive inteiramente em `app/api/` e `lib/`.
3. `conversion-tracking` adiciona os snippets client-side no layout raiz e o disparo server-side dentro do mesmo `api/webhook`, junto da liberação de acesso.
4. `qa-bug-hunter` testa a integração entre as três camadas de ponta a ponta.

Nenhuma dessas partes deve duplicar responsabilidade da outra — por exemplo, o cálculo de preço mora só no Stripe Dashboard/Price ID, nunca hardcoded em dois lugares.

## Passo 5 — Variáveis de ambiente

Padronize desde o início, mesmo antes de precisar de todas:

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=      (se entrega Opção B)
DRIVE_FOLDER_ID=
EMAIL_API_KEY=                     (Resend/SendGrid/Postmark)
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
META_PIXEL_ID=
META_CONVERSIONS_API_TOKEN=
```

Crie `.env.example` versionado (sem valores reais) e `.env.local` no `.gitignore`. Nunca deixe uma chave secreta em código que vai para o repositório ou para o bundle do frontend (variáveis que começam com `NEXT_PUBLIC_` no Next.js vão pro navegador — só use esse prefixo para dados que podem ser públicos, como o `GA4_MEASUREMENT_ID` do client-side).

## Passo 6 — Hospedagem e deploy

- Deploy recomendado: Vercel (gratuito para esse porte, integra Next.js nativamente, variáveis de ambiente na dashboard).
- Domínio próprio: configurar depois do deploy inicial funcionar em `*.vercel.app`.
- Webhook do Stripe precisa apontar para a URL de produção (`https://seudominio.com/api/webhook`) — lembrar de atualizar no Dashboard do Stripe quando o domínio final estiver pronto, e trocar de chaves de teste (`sk_test_`) para produção (`sk_live_`) só depois de tudo validado (ver skill `qa-bug-hunter`).

## Checklist de arquitetura antes de começar a codar

- [ ] Stack definida e justificada (não só copiada por padrão)
- [ ] Fica claro o que é client-side vs server-side
- [ ] Estrutura de pastas criada antes de escrever a primeira linha de copy/checkout
- [ ] `.env.example` criado com todas as chaves que o projeto vai precisar
- [ ] Decisão tomada sobre onde hospedar (mesmo que só provisoriamente)

Depois de montar o esqueleto, siga para `ebook-landing-page` (conteúdo da página), depois `stripe-drive-checkout` (pagamento e entrega), depois `conversion-tracking` (métricas), e feche com `qa-bug-hunter` antes de publicar.
