---
name: ebook-cover-design
description: "Use esta skill sempre que o usuário precisar criar ou orientar a criação de capas de ebook e mockups 3D para usar na landing page. Gatilhos: 'capa do ebook', 'mockup', 'design da capa', 'imagem 3D do livro', 'preciso de uma capa'. Use antes ou durante a construção da landing page (skill ebook-landing-page), já que ela depende dessas imagens."
---

# Ebook Cover Design

Skill para orientar a criação de capas de ebook e mockups 3D usados na landing page — a parte visual que mais influencia a percepção de valor do produto antes mesmo de qualquer leitura do copy.

## Contexto de capacidade

Claude não gera imagens/artes diretamente nesta skill (gerar arte foge do escopo de código). O papel aqui é: (1) orientar as especificações de design corretas, (2) montar o mockup 3D a partir de uma capa 2D usando ferramentas/bibliotecas, e (3) se houver uma skill de geração de imagem disponível no ambiente (ex: `imagegen`), usá-la para gerar a arte base, deixando claro ao usuário quando isso está acontecendo.

## Passo 1 — Especificação da capa 2D

Antes de qualquer arte, definir com o usuário:
- Título e subtítulo exatos do ebook (letra por letra — evita retrabalho).
- Paleta de cores alinhada à identidade visual da landing page (a capa deve combinar com o resto do site, não destoar).
- Estilo: minimalista/clean (mais comum em infoprodutos B2C), editorial/sério (nichos técnicos/profissionais), ou ilustrado (nichos lifestyle/criativos) — perguntar se não estiver claro.
- Proporção: capas de ebook tradicionalmente usam proporção próxima a 1.6:1 (altura:largura), ex: 1600x2560px para boa qualidade em mockup 3D.

## Passo 2 — Gerar a arte

- Se houver uma skill/ferramenta de geração de imagem disponível no ambiente, usá-la com um prompt que inclua: título, subtítulo, estilo definido no Passo 1, paleta de cores, e "capa de ebook profissional, sem texto ilegível, espaço para título centralizado".
- Se não houver ferramenta de geração de imagem disponível, oriente o usuário a produzir a arte em Canva (tem templates de capa de ebook prontos) ou contratar um designer, e prossiga para o mockup 3D assim que ele tiver a arte 2D final.
- Nunca usar capas de produtos de terceiros/concorrentes como referência direta a ponto de plagiar layout — inspirar-se em estilo é diferente de copiar.

## Passo 3 — Mockup 3D a partir da capa 2D

Para transformar a capa plana em um "livro 3D" (padrão do mercado de infoproduto), duas abordagens:

**Opção A — Serviço/ferramenta pronta (mais rápido)**
- Ferramentas como Canva (templates de mockup 3D), Placeit, ou geradores gratuitos online aceitam upload da capa 2D e devolvem o mockup 3D pronto em PNG transparente.
- Recomendado para quem não tem urgência em automatizar.

**Opção B — Gerar via CSS 3D transform (para quem quer algo dinâmico/customizável no próprio site)**
Um mockup simples pode ser feito só com CSS, sem precisar de imagem 3D renderizada:

```css
.book-cover {
  width: 220px;
  height: 320px;
  background-image: url('/capa-2d.jpg');
  background-size: cover;
  transform: perspective(1000px) rotateY(-25deg);
  box-shadow: -15px 15px 30px rgba(0,0,0,0.3);
  border-radius: 2px 6px 6px 2px;
}
```
Isso evita depender de uma imagem 3D pré-renderizada e reage bem a diferentes tamanhos de tela, mas visualmente é mais simples que um mockup fotorrealista.

## Passo 4 — Combinando múltiplos ebooks (pacote/bundle)

Se o produto é um pacote com vários ebooks (comum neste projeto), o mockup do hero geralmente mostra as capas em leque/empilhadas. Duas formas:
- Composição manual em ferramenta de design (Canva/Photoshop) com as capas 3D já prontas, sobrepostas.
- Composição via CSS/HTML posicionando múltiplos `.book-cover` com `position: absolute` e leve rotação/offset entre eles, para efeito de leque.

## Checklist

- [ ] Título/subtítulo revisado letra por letra antes de gerar a arte final
- [ ] Paleta de cores da capa combina com a identidade da landing page
- [ ] Mockup 3D com boa resolução para hero (mínimo ~800px de largura)
- [ ] Se pacote com vários ebooks: composição em leque testada em mobile (não pode ficar ilegível)
- [ ] Nenhuma capa de terceiro usada sem permissão/plagiando layout
