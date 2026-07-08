---
name: email-automation
description: "Use esta skill sempre que o usuário quiser configurar e-mails automáticos além da simples entrega do produto: recuperação de carrinho abandonado, sequência de boas-vindas, upsell pós-compra, ou qualquer automação de e-mail marketing para o funil de venda de ebooks. Gatilhos: 'carrinho abandonado', 'e-mail automático', 'sequência de e-mail', 'upsell', 'recuperar venda perdida', 'automação de marketing'. Use junto com stripe-drive-checkout (que já cuida do e-mail transacional de entrega) para adicionar as automações que aumentam conversão."
---

# Email Automation

Skill para configurar as automações de e-mail que normalmente aumentam mais a receita do que qualquer ajuste de copy na landing page: recuperação de carrinho abandonado, boas-vindas e upsell.

## Diferença importante: transacional vs marketing

- **E-mail transacional** (entrega do produto, confirmação de compra) já é coberto pela skill `stripe-drive-checkout` — precisa de alta taxa de entrega e vai direto no webhook.
- **E-mail de automação/marketing** (este aqui) precisa de uma ferramenta com sequências programadas (Resend + fila própria, ou uma ferramenta de automação como ActiveCampaign, Mailchimp, Brevo, ConvertKit). Escolha com o usuário — não force uma ferramenta pesada se o volume de vendas for baixo.

## Passo 1 — Capturar o e-mail antes da compra (pré-requisito)

Para recuperar carrinho abandonado, você precisa do e-mail **antes** da compra ser concluída. Duas formas:

1. **Stripe Checkout com coleta antecipada**: o Checkout do Stripe já pede e-mail no próprio formulário, mas só sabemos o e-mail depois que o cliente preenche — para recuperar quem nem chegou a preencher, é preciso capturar antes, com um campo de e-mail na própria landing page antes do redirect (ex: "digite seu e-mail para continuar" ou um formulário de lead magnet).
2. **Stripe abandoned cart nativo**: o Stripe tem recursos de recuperação de link expirado/checkout incompleto em contas com "Checkout" configurado — verificar no Dashboard se está disponível para a conta do usuário (varia por região/plano).

Se o usuário não quiser fricção extra pedindo e-mail antes do clique em comprar, seja honesto: a recuperação de carrinho abandonado fica limitada a quem chegou a preencher o e-mail no Stripe e não finalizou — ainda é possível, mas via evento `checkout.session.expired` do próprio Stripe.

## Passo 2 — Sequência de carrinho abandonado

Gatilho: evento `checkout.session.expired` (ou X horas sem `checkout.session.completed` para aquele e-mail).

Sequência sugerida (ajustar tom ao nicho do usuário):
1. **1h depois**: lembrete simples — "você deixou algo pra trás", reforça o que a pessoa ia levar.
2. **24h depois**: reforça prova social/benefício, sem desconto ainda.
3. **48-72h depois**: considerar oferta de urgência real (ex: bônus por tempo limitado) — só usar se for verdade, nunca fake.

Implementação: webhook escuta `checkout.session.expired`, dispara a primeira automação na ferramenta de e-mail escolhida (via API ou webhook interno dela).

## Passo 3 — Sequência de boas-vindas (pós-compra)

Além do e-mail transacional de entrega (skill `stripe-drive-checkout`), uma pequena sequência ajuda a reduzir reembolso e aumentar satisfação:
1. **Imediato**: entrega (já coberto na outra skill).
2. **2-3 dias depois**: "conseguiu acessar? aqui vai como aproveitar melhor o material" — reduz pedidos de suporte e reembolso por "não sabia como abrir".
3. **7 dias depois** (opcional): pedir feedback/depoimento — vira prova social real para a skill `ebook-landing-page`.

## Passo 4 — Upsell pós-compra

Se o usuário tiver mais de um produto/pacote, uma oferta complementar pode ser enviada:
- Só depois da confirmação de pagamento do produto principal (nunca antes — não interrompa o checkout original com upsell, isso derruba conversão).
- E-mail 3-5 dias após a compra com um produto relacionado, com preço especial "porque você já é cliente".

## Passo 5 — Compliance do e-mail marketing

- Toda automação precisa de link de descadastro (obrigatório e trata risco de spam/reclamação).
- Conectar com a skill `legal-compliance`: mencionar na Política de Privacidade que o e-mail é usado para essas sequências.
- Não usar linguagem enganosa de urgência (contadores falsos, "última chance" repetida sem verdade) — além de eticamente problemático, gera desconfiança e mais reembolso.

## Checklist

- [ ] Ferramenta de automação escolhida e configurada (ou fila própria via Resend/similar)
- [ ] Captura de e-mail antes da conclusão do checkout, se recuperação de carrinho for prioridade
- [ ] Sequência de carrinho abandonado configurada (mínimo 2 e-mails)
- [ ] Sequência de boas-vindas configurada
- [ ] Link de descadastro presente em todo e-mail de automação
- [ ] Política de Privacidade menciona o uso do e-mail para essas automações
