---
name: seo-content
description: "Use esta skill sempre que o usuário quiser melhorar o SEO da landing page, configurar meta tags, Open Graph para compartilhamento em redes sociais, ou aparecer melhor no Google. Gatilhos: 'SEO', 'aparecer no Google', 'meta tags', 'Open Graph', 'compartilhar no WhatsApp/Instagram', 'preview do link', 'otimizar pra busca'. Use ao finalizar a landing page (skill ebook-landing-page) e antes da publicação."
---

# SEO Content

Skill para otimizar a landing page de venda de ebooks para aparecer melhor em buscas orgânicas e para que o link tenha uma prévia (preview) bonita quando compartilhado em redes sociais.

## Contexto realista

Uma landing page de venda direta (single page, foco em conversão) não vai competir por SEO de conteúdo como um blog compete — o objetivo aqui é (1) garantir o básico técnico para não ser prejudicado, e (2) ter um preview de compartilhamento (Open Graph) impecável, já que a maior parte do tráfego de infoproduto vem de link compartilhado em redes/anúncios, não de busca orgânica.

## Passo 1 — Meta tags essenciais

No `<head>` (ou `metadata` do Next.js):

```html
<title>[Nome do produto] — [transformação/benefício principal]</title>
<meta name="description" content="[1-2 frases com o benefício e call-to-action, até ~155 caracteres]">
<link rel="canonical" href="https://seudominio.com/">
```

- Título: incluir o nome do produto + o resultado prometido, não só "Página de Vendas".
- Description: escrever para converter clique na busca, não só descrever — tratar como uma mini-copy.

## Passo 2 — Open Graph (preview em WhatsApp, Instagram, Facebook, LinkedIn)

```html
<meta property="og:title" content="[mesmo título ou variação curta]">
<meta property="og:description" content="[descrição curta e persuasiva]">
<meta property="og:image" content="https://seudominio.com/og-image.jpg">
<meta property="og:type" content="product">
<meta property="og:url" content="https://seudominio.com/">
<meta name="twitter:card" content="summary_large_image">
```

Requisitos da imagem `og:image`:
- Tamanho recomendado: 1200x630px.
- Deve mostrar o mockup dos ebooks + uma headline curta legível mesmo em miniatura (o WhatsApp corta bastante).
- Testar antes de publicar em: Facebook Sharing Debugger, e enviando o link pra si mesmo no WhatsApp (o cache do WhatsApp é agressivo — usar `?v=2` ou parâmetro de versão ao atualizar a imagem depois de já ter sido compartilhada).

## Passo 3 — Schema.org (dados estruturados de produto)

Ajuda o Google a entender que é um produto à venda, podendo exibir preço/avaliação no resultado de busca:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Nome do produto]",
  "description": "[descrição]",
  "offers": {
    "@type": "Offer",
    "price": "97.00",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock"
  }
}
```
Inserir como `<script type="application/ld+json">` no `<head>`. Só incluir `aggregateRating` se houver avaliações reais — nunca inventar nota/quantidade.

## Passo 4 — Checklist técnico básico

- [ ] Página tem apenas um `<h1>` (geralmente a headline do hero)
- [ ] Hierarquia de headings lógica (`h1` > `h2` > `h3`, sem pular níveis)
- [ ] Imagens com atributo `alt` descritivo (também ajuda acessibilidade)
- [ ] URL limpa (sem parâmetros desnecessários na URL principal)
- [ ] Site responde em HTTPS (padrão em Vercel/Netlify)
- [ ] `sitemap.xml` e `robots.txt` básicos, mesmo que seja uma página só

## Passo 5 — Não fazer

- Não empilhar palavras-chave escondidas ou texto invisível — Google penaliza e não converte visitante.
- Não prometer no meta description algo que a página não cumpre (aumenta taxa de rejeição, prejudica ranking a médio prazo).
- Não usar imagens de banco de imagens genéricas como `og:image` — usar mockup real do produto sempre que possível, converte mais no compartilhamento.

Depois de configurar, teste o compartilhamento (WhatsApp, Facebook Debugger) antes de rodar tráfego pago — um preview quebrado derruba CTR de anúncio.
