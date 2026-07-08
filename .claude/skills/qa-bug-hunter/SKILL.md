---
name: qa-bug-hunter
description: Use esta skill sempre que o usuário pedir para testar, revisar, achar bugs, ou "ver se está tudo funcionando" na landing page, no checkout ou no fluxo de entrega do projeto de venda de ebooks — mesmo sem a palavra "teste" explícita, como "confere se funciona", "por que não está entrando o pagamento", "o botão não funciona", "revisa antes de eu publicar". Cubra tanto testes funcionais (checkout, formulários, links) quanto responsividade e performance. Use esta skill ANTES de qualquer publicação/deploy do projeto.
---

# QA & Bug Hunter

Skill para testar sistematicamente a landing page e o fluxo de checkout/entrega antes (e depois) de publicar, e para investigar e corrigir bugs relatados.

## Quando usar

- Antes de qualquer deploy/publicação.
- Quando o usuário relata "não está funcionando" — sempre reproduza o problema antes de propor correção.
- Periodicamente após mudanças grandes em copy, layout ou lógica de checkout.

## Passo 1 — Checklist funcional da landing page

Rode manualmente (ou escreva um script Playwright/Puppeteer se o projeto tiver testes automatizados) cobrindo:

- [ ] Todos os links internos (âncoras de CTA) levam à seção/checkout correto
- [ ] Todas as imagens carregam (sem 404) — inclusive em conexão lenta
- [ ] Formulários (se houver captura de e-mail/lead) validam campos obrigatórios
- [ ] Página renderiza corretamente em: mobile (375px), tablet (768px), desktop (1440px)
- [ ] Nenhum texto cortado/sobreposto em nenhuma largura
- [ ] Fontes e cores carregam (sem FOUC quebrando o layout)
- [ ] Console do navegador sem erros JS (`console.error`)
- [ ] Tempo de carregamento razoável (Lighthouse — mirar em >80 performance mobile)

## Passo 2 — Checklist do fluxo de pagamento (crítico)

Nunca considere o checkout "pronto" sem testar o fluxo fim-a-fim com chaves de TESTE do Stripe:

1. Clicar no CTA → deve abrir o Checkout Session do Stripe corretamente (produto certo, preço certo).
2. Pagar com cartão de teste `4242 4242 4242 4242`, validade futura qualquer, CVC qualquer.
3. Confirmar que o webhook disparou (`stripe listen` no terminal deve mostrar o evento `checkout.session.completed`).
4. Confirmar que o e-mail de entrega chegou (ou que a permissão no Drive foi criada, se Opção B).
5. Testar cartão de recusa (`4000 0000 0000 0002`) → o cliente deve ver mensagem de erro clara, e o acesso NÃO pode ser liberado.
6. Testar reenvio do mesmo evento de webhook (idempotência) — não deve duplicar e-mails nem duplicar registro de venda.
7. Testar o botão "voltar"/cancelar no meio do checkout — não deve travar a página.

## Passo 3 — Investigar um bug relatado

Ao receber "não está funcionando":
1. Peça (ou procure nos logs/console) a mensagem de erro exata e em qual passo ocorre.
2. Reproduza localmente antes de alterar qualquer código — não adivinhe a causa.
3. Isole a camada: é frontend (JS/CSS), é a chamada de API para criar a Checkout Session, ou é o webhook/backend?
4. Para bugs de pagamento, sempre olhe primeiro o Dashboard do Stripe (aba Eventos/Webhooks) para ver se o evento chegou e qual foi a resposta HTTP do seu endpoint.
5. Corrija a causa raiz, não só o sintoma — e adicione um teste/checklist item cobrindo esse caso para não regressar.

## Passo 4 — Relatório para o usuário

Depois de testar, reporte de forma objetiva:
- O que foi testado
- O que passou
- O que falhou, com o passo exato de reprodução
- O que foi corrigido (se aplicável) e o que ainda precisa de decisão do usuário (ex: credenciais faltando, chave de API não configurada)

Nunca declare "está tudo funcionando" sem ter de fato rodado o Passo 2 (fluxo de pagamento) — é a parte que mais gera prejuízo se quebrada silenciosamente.
