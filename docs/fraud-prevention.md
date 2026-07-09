# Prevenção de fraude — DriveBooks

Este documento cobre a parte de **configuração manual no Dashboard do Stripe** da
skill `fraud-prevention`. A parte de **código** já está implementada (ver
"O que já está no código" no fim). Estes passos precisam ser feitos por você, uma
vez, no painel — o código não consegue alterá-los.

> Conta Stripe: `acct_1TQ9Vg4Q8acXrqpy` ("Metodo CRM") — **compartilhada** com
> outro produto. Cuidado: regras de Radar valem para a conta inteira. Onde fizer
> sentido, restrinja a regra ao DriveBooks usando o metadata `produto = drivebooks-acesso`
> (que o checkout já grava no PaymentIntent).

## 1. Stripe Radar — regras

Dashboard → **Radar → Rules** (https://dashboard.stripe.com/radar/rules)

1. **Bloquear risco mais alto** (geralmente já existe como regra padrão; confirme
   que está ativa):
   ```
   Block if :risk_level: = 'highest'
   ```
2. **Revisar (não bloquear) risco elevado** — evita perder venda legítima por
   excesso de zelo. Cria um item em Radar → Reviews para você olhar manualmente:
   ```
   Review if :risk_level: = 'elevated'
   ```
3. (Opcional, conta compartilhada) Se quiser uma regra que valha só para o
   DriveBooks, prefixe com o metadata do produto, por exemplo:
   ```
   Block if :metadata['produto']: = 'drivebooks-acesso' and :risk_level: = 'highest'
   ```

## 2. 3D Secure

Dashboard → **Radar → Rules** → seção "Request 3D Secure".

- Ativar a regra recomendada pelo Stripe: pedir 3DS quando o cartão suportar e o
  risco justificar. O 3DS transfere a responsabilidade da fraude para o banco
  emissor em caso de "fraudulent". Regra típica:
  ```
  Request 3D Secure if :risk_level: = 'elevated'
  ```
- No Brasil o suporte a 3DS/AVS é mais limitado que em cartões US/EU — mantenha,
  mas não conte com ele como única barreira.

## 3. CVC e endereço (AVS)

Dashboard → **Settings → Payments → Card verification / Radar**.

- Deixar a verificação de CVC ativada (bloquear quando o CVC falhar).
- Verificação de endereço (AVS) tem cobertura limitada no Brasil; ative se boa
  parte do público for de cartões internacionais.

## 4. Statement descriptor (nome na fatura)

Dashboard → **Settings → Business → Public details / Statement descriptors**.

- Como a conta é compartilhada, o descritor padrão da conta pode aparecer como
  "METODO CRM" na fatura do comprador do DriveBooks — isso gera chargeback do
  tipo "não reconheço a cobrança".
- **Já resolvido no código** via a env var `STRIPE_STATEMENT_DESCRIPTOR`
  (padrão `DRIVEBOOKS`), que o checkout envia por cobrança. Basta garantir que a
  variável esteja setada na Vercel. Se preferir, ajuste também o descritor padrão
  da conta no Dashboard. Regras do descritor: máx. 22 caracteres, sem
  `< > \ " ' *`.

## 5. Webhook — evento de disputa

Dashboard → **Developers → Webhooks** → seu endpoint (`/api/webhook`).

- Além de `checkout.session.completed`, **adicione o evento**:
  ```
  charge.dispute.created
  ```
- Sem isso, o Stripe não notifica a aplicação quando entra um chargeback e a
  revogação automática de acesso ao Drive não roda.

## 6. Processo de reembolso visível

- Manter a política de reembolso fácil e visível na landing (skill
  `legal-compliance`). Reembolso fácil = menos gente indo direto pro chargeback.
- Responder rápido a reclamações por e-mail antes de virarem disputa.

## 7. Quando cair um chargeback

1. O acesso ao Drive daquele comprador **já é revogado automaticamente** pelo
   webhook, e o caso fica registrado como evento `chargeback` no banco.
2. Para contestar, junte a evidência de entrega (e-mail de entrega enviado,
   permissão concedida no Drive, timestamp da compra) e submeta em
   Dashboard → **Payments → (a cobrança) → Dispute → Submit evidence**.
3. Ticket baixo (R$ 39,90): nem toda disputa compensa o tempo de contestar. Se
   houver padrão recorrente, ajuste o processo em vez de brigar caso a caso.

---

## O que já está no código (não precisa fazer nada)

- `app/api/checkout/route.ts`: grava `metadata.produto` também no PaymentIntent
  (permite filtrar disputas na conta compartilhada) e aplica o
  `STRIPE_STATEMENT_DESCRIPTOR` por cobrança.
- `app/api/webhook/route.ts`: trata `charge.dispute.created` — filtra pelo
  produto, revoga o acesso ao Drive (`revokeFolderAccess`) e registra o evento
  `chargeback`.
- Rate limiting no checkout já existente (`lib/rate-limit.ts`).

## Checklist

- [ ] Radar: regra de block em `risk_level = 'highest'` ativa
- [ ] Radar: regra de review em `risk_level = 'elevated'` ativa
- [ ] 3D Secure configurado onde disponível
- [ ] CVC/AVS revisados
- [ ] `STRIPE_STATEMENT_DESCRIPTOR` setado na Vercel (nome reconhecível na fatura)
- [ ] Webhook inscrito em `charge.dispute.created`
- [ ] Política de reembolso fácil e visível na landing
