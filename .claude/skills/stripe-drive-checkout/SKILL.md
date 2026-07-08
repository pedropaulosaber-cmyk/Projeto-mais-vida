---
name: stripe-drive-checkout
description: "Use esta skill sempre que o usuário precisar implementar cobrança/checkout com Stripe para um produto digital cuja entrega é acesso a uma pasta do Google Drive (ou link de download), incluindo criação de Checkout Session, webhook de confirmação de pagamento, e liberação automática do acesso ao comprador. Gatilhos: 'checkout', 'pagamento', 'Stripe', 'cobrar pelo ebook', 'liberar acesso ao Drive depois do pagamento', 'entrega automática', 'webhook de pagamento'. Use ANTES de escrever qualquer código de pagamento, define o fluxo correto e seguro (nunca liberar acesso no frontend, sempre confirmar via webhook)."
---

# Stripe + Google Drive Checkout

Skill para implementar o fluxo completo de venda: cliente paga via Stripe → pagamento confirmado no backend → acesso ao Drive é liberado/entregue automaticamente.

## Princípio inegociável

**Nunca libere o acesso ao Drive (ou mostre o link) só porque o frontend redirecionou para uma "página de sucesso".** URLs de sucesso podem ser acessadas manualmente sem pagar. A liberação do acesso SEMPRE deve depender da confirmação do pagamento vinda do **webhook do Stripe** (evento `checkout.session.completed`), nunca do client-side.

## Passo 1 — Modelo de entrega: escolha uma abordagem

Existem duas formas de "entregar acesso a um Drive", escolha com o usuário:

**Opção A — Drive público por link direto (mais simples, menos seguro)**
- Um único link de pasta do Drive com permissão "qualquer pessoa com o link".
- Após pagamento confirmado, o link é mostrado na página de obrigado E enviado por e-mail.
- Risco: o link pode ser compartilhado livremente depois. Aceitável para produtos de baixo ticket.

**Opção B — Acesso individual via Google Drive API (mais robusto)**
- Uma pasta "mestre" no Drive do vendedor.
- Ao confirmar pagamento, usa-se a Google Drive API para compartilhar a pasta especificamente com o e-mail do comprador (`permissions.create` com o e-mail dele).
- Mais rastreável, pode revogar acesso individual depois. Requer Service Account do Google configurada.

Se o usuário não especificar, pergunte qual prefere — isso muda a arquitetura.

## Passo 2 — Criar a Checkout Session (Stripe)

Backend (Node/Express, Python/Flask, ou serverless function — adapte à stack do projeto):

```js
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{
    price: "price_XXXXX", // criar o Price no Dashboard do Stripe ou via API
    quantity: 1,
  }],
  customer_email: undefined, // deixe o Stripe coletar o e-mail no próprio checkout
  success_url: "https://seusite.com/obrigado?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "https://seusite.com/",
  metadata: { produto: "pacote-ebooks-X" }, // útil se houver múltiplos produtos
});
```

O frontend apenas chama esse endpoint e redireciona (`window.location = session.url`). Nunca crie a Session no frontend nem exponha a `secret key` no client.

## Passo 3 — Webhook: a única fonte de verdade

Endpoint dedicado, validando a assinatura do Stripe:

```js
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const buyerEmail = session.customer_details.email;
    // 1) registrar a compra (banco de dados ou planilha)
    // 2) liberar acesso: Opção A -> disparar e-mail com o link; Opção B -> compartilhar pasta via Drive API
    // 3) idempotência: verifique se esse session.id já foi processado antes de liberar de novo
  }
  res.json({ received: true });
});
```

Pontos críticos:
- **Idempotência**: o Stripe pode reenviar o mesmo evento. Guarde `session.id` processados (banco/planilha) e ignore duplicatas.
- **Nunca confie em `req.body` sem validar a assinatura** — é assim que se evita liberação fraudulenta de acesso.
- Rode local com `stripe listen --forward-to localhost:PORT/webhook` para testar antes de publicar.

## Passo 4 — Entrega ao comprador

Envie por e-mail (SendGrid, Resend, Postmark, ou até Gmail API) uma mensagem de confirmação com o link/acesso, além de mostrar na página de obrigado (usando o `session_id` da URL para consultar o status via `stripe.checkout.sessions.retrieve` — nunca confie apenas no redirecionamento).

Template mínimo de e-mail: confirmação da compra, valor pago, link de acesso, instruções (ex: "adicione seudrive@gmail.com se pedir login", prazo de acesso se houver expiração), e contato de suporte.

## Passo 5 (Opção B) — Google Drive API

Requer:
1. Criar Service Account no Google Cloud Console, ativar Drive API.
2. Compartilhar a pasta mestre com o e-mail da Service Account (como editor).
3. No webhook, após pagamento:
```js
await drive.permissions.create({
  fileId: FOLDER_ID,
  requestBody: { role: "reader", type: "user", emailAddress: buyerEmail },
  sendNotificationEmail: true,
});
```
Guarde as credenciais da Service Account como variável de ambiente (nunca commitadas no repo).

## Segurança — checklist

- [ ] Secret key do Stripe só existe no backend/variáveis de ambiente
- [ ] Webhook valida assinatura (`STRIPE_WEBHOOK_SECRET`)
- [ ] Acesso só é liberado após `checkout.session.completed`, nunca antes
- [ ] Processamento de webhook é idempotente
- [ ] Se Opção A: link do Drive não está hardcoded em HTML público sem barreira nenhuma antes do pagamento

Depois de implementar, use a skill `qa-bug-hunter` para testar o fluxo completo (incluindo pagamento de teste com cartão `4242 4242 4242 4242`) antes de ir para produção, e troque as chaves de teste (`sk_test_`) pelas de produção (`sk_live_`) só no final.
