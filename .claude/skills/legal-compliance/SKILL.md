---
name: legal-compliance
description: "Use esta skill sempre que o usuário precisar de termos de uso, política de privacidade, política de reembolso/garantia, aviso de direitos autorais, ou qualquer texto legal para a landing page de venda de ebooks. Gatilhos: 'termos de uso', 'política de privacidade', 'LGPD', 'reembolso', 'garantia', 'direitos autorais', 'preciso ficar dentro da lei', 'isso é obrigatório?'. Use esta skill ao publicar o site pela primeira vez e sempre que o usuário adicionar coleta de dados (formulário, pixel, e-mail) ou mudar a política de garantia."
---

# Legal Compliance

Skill para gerar e revisar os textos legais mínimos necessários para vender um produto digital no Brasil, e apontar quando é hora de um advogado revisar de verdade.

## Aviso importante antes de tudo

Esta skill produz **rascunhos de referência**, não aconselhamento jurídico. Deixe isso explícito para o usuário sempre que entregar um documento: "isto é um ponto de partida — para blindagem jurídica completa, um advogado deve revisar antes de publicar, especialmente se o faturamento crescer."

## Passo 1 — Documentos mínimos para uma página de venda de ebook

1. **Termos de Uso** — regras de uso do produto, propriedade intelectual (o ebook é licenciado para uso pessoal, não pode ser revendido/redistribuído), limitação de responsabilidade.
2. **Política de Privacidade (LGPD)** — quais dados são coletados (nome, e-mail, dados de pagamento processados pelo Stripe), finalidade, com quem são compartilhados (Stripe, Google, ferramentas de e-mail/analytics), direitos do titular (acesso, correção, exclusão), contato do responsável.
3. **Política de Reembolso/Garantia** — prazo (ex: 7 dias, padrão do Código de Defesa do Consumidor para compra online é direito de arrependimento de 7 dias), como solicitar, prazo de devolução do valor.
4. **Aviso de Direitos Autorais** — deixa claro que o conteúdo dos ebooks é protegido e cópia/redistribuição não autorizada pode gerar responsabilização.

## Passo 2 — Regras específicas que não podem ser ignoradas

- **Direito de arrependimento (Art. 49, CDC)**: compra feita fora do estabelecimento físico (o que inclui todo e-commerce) dá ao consumidor 7 dias corridos para desistir e pedir reembolso integral, sem precisar justificar. Isso é lei, não é "política de marketing" — não prometa menos que isso, mesmo que o produto seja digital e já tenha sido acessado.
- **LGPD**: qualquer coleta de e-mail (mesmo só para entrega do produto) exige política de privacidade visível e, se usar pixels de rastreamento (Meta/Google), um aviso de cookies/consentimento é recomendado.
- **Precificação clara**: o preço final, incluindo qualquer parcelamento, deve estar visível antes do checkout — nada de taxa escondida que só aparece na tela de pagamento do Stripe.
- **Dados do vendedor**: CNPJ/CPF, nome, e-mail de contato devem estar acessíveis (rodapé ou página "Sobre") — obrigatório para relação de consumo.

## Passo 3 — Estrutura de cada documento

### Política de Privacidade — seções obrigatórias
1. Quem é o controlador dos dados (nome/CNPJ do vendedor)
2. Quais dados são coletados e como (formulário, checkout, cookies/pixels)
3. Finalidade de cada coleta
4. Com quem os dados são compartilhados (Stripe para pagamento, Google/Meta para anúncios, ferramenta de e-mail)
5. Prazo de retenção
6. Direitos do titular e como exercê-los (canal de contato)
7. Data da última atualização

### Política de Reembolso — seções obrigatórias
1. Prazo de arrependimento (mínimo 7 dias, pode ser maior como diferencial de marketing — nunca menor)
2. Como solicitar (e-mail, formulário)
3. Prazo de devolução do valor após solicitação
4. O que acontece com o acesso ao Drive após reembolso (revogar o acesso — conectar com skill `stripe-drive-checkout`/`content-protection`)

## Passo 4 — Onde colocar no site

- Links no rodapé da landing page (skill `ebook-landing-page`), sempre visíveis.
- Checkbox de aceite (opcional mas recomendado) antes do botão final de compra: "Li e aceito os Termos de Uso e a Política de Privacidade", linkando para os documentos.
- Páginas dedicadas (`/termos`, `/privacidade`, `/reembolso`) — não esconder em popup.

## Passo 5 — Quando recomendar advogado de verdade

Sinalize explicitamente ao usuário que ele deve buscar um advogado quando:
- O faturamento crescer e ficar relevante para questões tributárias/regulatórias.
- Houver dúvida sobre enquadramento tributário (MEI, Simples Nacional) — isso está fora do escopo desta skill.
- Surgir alguma disputa/reclamação formal (Procon, ação judicial).
- Quiser vender para outros países (regras mudam — GDPR na Europa, por exemplo).

## Checklist final

- [ ] Termos de Uso, Privacidade e Reembolso publicados e linkados no rodapé
- [ ] Prazo de reembolso respeita no mínimo os 7 dias do CDC
- [ ] Dados do vendedor (contato, CNPJ/CPF) visíveis no site
- [ ] Usuário avisado de que os textos são um ponto de partida, não substituem revisão jurídica
