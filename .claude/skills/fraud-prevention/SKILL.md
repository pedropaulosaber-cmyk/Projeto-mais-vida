---
name: fraud-prevention
description: "Use esta skill sempre que o usuário quiser configurar proteção contra fraude, reduzir chargebacks, revisar o Stripe Radar, ou perguntar sobre compras suspeitas/estornos no checkout de ebooks. Gatilhos: 'chargeback', 'estorno', 'fraude', 'Stripe Radar', 'compra suspeita', 'contestação de pagamento'. Use ao configurar o checkout (junto com stripe-drive-checkout) e sempre que houver um chargeback real para revisar o processo."
---

# Fraud Prevention

Skill para configurar proteção básica contra fraude no checkout e reduzir a taxa de chargeback — comum em produtos digitais de baixo ticket, onde o custo/benefício de investigar cada caso manualmente é baixo, então prevenção automática importa mais.

## Contexto: por que isso importa mais em infoproduto

Produtos digitais de baixo ticket têm taxa de chargeback historicamente mais alta que produtos físicos (mais fácil para o comprador contestar "não reconheço a compra" sem processo de disputa custoso), e cada chargeback gera taxa extra cobrada pelo Stripe além da perda da venda. Prevenção automática compensa mais que perseguir caso a caso.

## Passo 1 — Stripe Radar (já incluso, ativar as regras certas)

O Stripe Radar vem habilitado por padrão nas contas Stripe com regras básicas de machine learning. Passos para reforçar:
1. No Dashboard do Stripe → Radar → Regras: adicionar regras específicas, por exemplo:
   - Bloquear automaticamente se `:risk_level: = 'highest'`.
   - Revisar manualmente (não bloquear automaticamente) se `:risk_level: = 'elevated'` — evita perder vendas legítimas por excesso de zelo.
2. Ativar exigência de CVC e verificação de endereço (AVS) quando o público-alvo for de país com esse recurso disponível (padrão em cartões americanos/europeus, mais limitado no Brasil).
3. Configurar 3D Secure quando disponível na região do comprador — adiciona uma camada extra de autenticação que reduz responsabilidade do vendedor em caso de fraude comprovada.

## Passo 2 — Sinais de alerta manuais (revisão humana)

Mesmo com Radar, vale o usuário revisar manualmente quando:
- Múltiplas compras do mesmo cartão/e-mail em curto espaço de tempo.
- E-mail do comprador claramente descartável/temporário (domínios tipo `tempmail`, `guerrillamail`) — nesses casos, considerar segurar a liberação do acesso por algumas horas antes de liberar automaticamente, se o volume permitir esse tipo de checagem.
- Valor muito acima do ticket médio do produto sem motivo aparente (ex: alguém "comprando" 10 unidades do mesmo ebook).

## Passo 3 — Reduzir chargeback por insatisfação (não fraude real)

Boa parte do chargeback em infoproduto não é fraude de cartão, é insatisfação que vira contestação em vez de pedido de reembolso — porque é mais rápido para o comprador. Reduzir isso é mais sobre processo do que tecnologia:
- Deixar o processo de reembolso fácil e visível (skill `legal-compliance`) — se pedir reembolso é fácil, menos gente vai direto pro chargeback.
- E-mail de confirmação claro com nome da cobrança que vai aparecer na fatura do cartão (evita "não reconheço essa cobrança" só por o nome ser diferente do produto) — configurável em Stripe como `statement_descriptor`.
- Suporte responsivo: responder rápido quando alguém reclama antes de virar chargeback.

## Passo 4 — Quando um chargeback acontece

1. O Stripe notifica via evento `charge.dispute.created` — escutar esse evento no mesmo webhook (skill `stripe-drive-checkout`) para automaticamente:
   - Revogar o acesso ao Drive daquele comprador (ver skill `content-protection`, Passo 3).
   - Registrar o caso para follow-up.
2. Reunir evidência para contestar a disputa quando fizer sentido (produto foi entregue = prova de acesso ao Drive/e-mail enviado, IP e timestamp da compra) — o Stripe tem um fluxo próprio de "submeter evidência" no Dashboard.
3. Nem toda disputa vale a pena contestar — para valores baixos, o tempo gasto pode não compensar; para padrão recorrente do mesmo tipo de disputa, vale ajustar processo em vez de brigar caso a caso.

## Checklist

- [ ] Stripe Radar revisado e regras básicas configuradas (não deixar só no automático sem olhar)
- [ ] `statement_descriptor` configurado com nome reconhecível
- [ ] Processo de reembolso fácil e visível (reduz chargeback por atrito)
- [ ] Webhook escuta `charge.dispute.created` e revoga acesso automaticamente
- [ ] Processo definido para reunir evidência em disputas que valem a pena contestar
