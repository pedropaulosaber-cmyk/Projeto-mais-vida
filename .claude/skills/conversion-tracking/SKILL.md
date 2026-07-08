---
name: conversion-tracking
description: Use esta skill sempre que o usuário pedir para configurar rastreamento de conversão, pixel do Facebook/Meta, Google Analytics/GA4, Google Ads, TikTok Pixel, ou medir vendas/ROI da landing page de ebooks — gatilhos incluem "configurar pixel", "rastrear conversão", "saber quantas vendas vieram do anúncio", "GA4", "Meta Ads", "UTM", "evento de compra". Use esta skill para instalar e validar o rastreamento de forma correta, disparando o evento de compra apenas na confirmação real do pagamento (nunca na página de "obrigado" sem verificação).
---

# Conversion Tracking

Skill para instalar rastreamento de conversão confiável no funil: landing page → checkout Stripe → compra confirmada.

## Princípio central

O evento de "Compra" (`Purchase` / `purchase`) só deve disparar quando o pagamento foi **de fato confirmado**, idealmente a partir do backend/webhook (server-side), não só de um `pageview` na URL de sucesso — senão qualquer visitante que acessar a URL de obrigado manualmente vira uma "venda" falsa nas métricas, distorcendo o ROI dos anúncios.

## Passo 1 — Definir as ferramentas com o usuário

Pergunte quais ele já usa/quer usar (não assuma todas):
- **Google Analytics 4 (GA4)** — visão geral de tráfego e funil.
- **Meta Pixel / Conversions API** — se ele roda anúncios no Instagram/Facebook.
- **Google Ads (tag de conversão)** — se roda Google Ads.
- **TikTok Pixel** — se roda anúncios no TikTok.

Não instale todos "por garantia" se o usuário só vai anunciar em um canal — cada script adicional pesa na performance da página.

## Passo 2 — Eventos do funil a rastrear

Padronize estes eventos (nomes GA4-style, adapte para cada plataforma):

| Evento | Quando dispara | Onde |
|---|---|---|
| `page_view` | Carregamento da landing page | Client-side |
| `view_item` | Scroll até a seção de oferta/preço | Client-side |
| `begin_checkout` | Clique no botão de CTA (antes de redirecionar pro Stripe) | Client-side |
| `purchase` | Pagamento confirmado (`checkout.session.completed`) | **Server-side, no webhook** |

## Passo 3 — Client-side (GA4 + Meta Pixel básico)

No `<head>`, instalar os snippets padrão do GA4 e/ou Meta Pixel. Disparar `begin_checkout` no onClick do CTA, antes do redirect:

```js
function onClickComprar() {
  gtag('event', 'begin_checkout', { currency: 'BRL', value: PRECO });
  fbq('track', 'InitiateCheckout', { value: PRECO, currency: 'BRL' });
  window.location.href = checkoutUrl;
}
```

## Passo 4 — Server-side: o evento de compra real

No mesmo webhook do Stripe (`checkout.session.completed`, ver skill `stripe-drive-checkout`), disparar a conversão via API server-to-server — muito mais confiável que client-side (não é bloqueado por ad-blockers, funciona mesmo se o cliente fechar a aba):

- **GA4 Measurement Protocol**: enviar evento `purchase` via requisição HTTP para o endpoint de coleta do GA4, usando o `client_id` (capturado antes do redirect, ex: em um campo hidden ou no `metadata` da Checkout Session).
- **Meta Conversions API**: enviar evento `Purchase` via `POST` para a Graph API do Meta, com o valor e e-mail (hasheado) do comprador — passe o e-mail do Stripe para dar match melhor com o Pixel client-side.

Passo prático: ao criar a Checkout Session do Stripe (skill `stripe-drive-checkout`), inclua no `metadata` o `ga_client_id` e/ou `fbclid`/`fbp` capturados na página, para poder correlacionar a venda real ao evento client-side original.

## Passo 5 — UTMs

Garanta que a landing page preserve e repasse os parâmetros UTM (`utm_source`, `utm_medium`, `utm_campaign`) capturados na URL de entrada até o momento da compra (salvos em `metadata` da Checkout Session), para depois cruzar com o evento de `purchase` e saber qual campanha realmente vendeu.

## Passo 6 — Validação (não pule)

- GA4: usar o **DebugView** (Realtime) para confirmar que os eventos chegam com os parâmetros certos.
- Meta: usar o **Test Events** do Events Manager para validar o Pixel e a Conversions API — confirmar que os eventos client-side e server-side aparecem com o mesmo `event_id` (deduplicação) e não duplicam a conversão.
- Rodar uma compra de teste completa (cartão `4242...`) e conferir que exatamente UM evento de `purchase` aparece em cada plataforma.

## Checklist final

- [ ] `purchase` dispara apenas a partir da confirmação real de pagamento (server-side)
- [ ] Deduplicação configurada entre client-side e Conversions API (mesmo `event_id`)
- [ ] Valor e moeda corretos em todos os eventos de compra
- [ ] UTMs propagados até o evento de compra
- [ ] Testado com DebugView/Test Events antes de considerar concluído

Depois de configurar, use a skill `qa-bug-hunter` para incluir a validação de tracking no checklist de testes antes de publicar.
