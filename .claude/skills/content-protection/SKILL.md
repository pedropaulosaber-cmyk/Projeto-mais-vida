---
name: content-protection
description: "Use esta skill sempre que o usuário quiser proteger os ebooks contra pirataria/compartilhamento indevido, adicionar marca d'água nos PDFs, restringir o acesso ao Google Drive, ou revogar acesso de um comprador. Gatilhos: 'proteger meu ebook', 'evitar pirataria', 'marca d'água', 'watermark', 'meu produto vazou', 'revogar acesso', 'link do drive vazou'. Use esta skill junto com stripe-drive-checkout ao montar o fluxo de entrega, e sempre que houver suspeita de vazamento."
---

# Content Protection

Skill para reduzir (não eliminar — isso não existe para PDF) o risco de pirataria dos ebooks vendidos, e para reagir rápido quando um vazamento é identificado.

## Princípio realista

Não existe proteção 100% eficaz contra cópia de PDF — quem quiser piratear, consegue. O objetivo aqui é: (1) desincentivar o compartilhamento casual, (2) rastrear a origem se vazar, (3) limitar o alcance do link caso vaze, (4) conseguir revogar acesso rápido.

## Passo 1 — Marca d'água (watermark) personalizada

Ao entregar o PDF, inserir uma marca d'água discreta com o e-mail (ou nome) do comprador em cada página — isso funciona como dissuasão psicológica ("isso tem meu nome, não vou compartilhar") e permite identificar a fonte de um vazamento.

Implementação (Python, usando `pypdf` ou `reportlab` + `pypdf` para overlay):

```python
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

def watermark_pdf(input_path, output_path, buyer_email):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    c.setFont("Helvetica", 8)
    c.setFillAlpha(0.15)  # bem discreta
    c.drawString(50, 20, f"Licenciado para {buyer_email} — cópia/redistribuição não autorizada")
    c.save()
    packet.seek(0)

    watermark = PdfReader(packet)
    reader = PdfReader(input_path)
    writer = PdfWriter()
    for page in reader.pages:
        page.merge_page(watermark.pages[0])
        writer.add_page(page)
    with open(output_path, "wb") as f:
        writer.write(f)
```

Esse processo deve rodar **automaticamente no webhook** (mesmo lugar da skill `stripe-drive-checkout`), gerando uma cópia individual do PDF por comprador antes de liberar o acesso — não é viável fazer manualmente em escala.

Nota: isso exige gerar/armazenar um PDF por comprador (não só compartilhar o arquivo mestre), o que empurra naturalmente para a "Opção B" de entrega da skill `stripe-drive-checkout` (pasta individual por comprador) em vez do link único público.

## Passo 2 — Restringir o link do Drive

Se optar por manter link único (Opção A da skill de checkout), reduza o alcance:
- Permissão "qualquer pessoa com o link" apenas como **leitor**, nunca editor.
- Desativar a opção de download quando possível (Drive permite restringir download/impressão/cópia em "Configurações de compartilhamento avançadas" — reduz cópia casual, não impede print/screenshot).
- Trocar o link periodicamente (ex: mensalmente) para limitar o tempo de vida de um link vazado — mas isso exige avisar compradores ativos, então pese o custo operacional.

Prefira sempre que possível a Opção B (permissão individual por e-mail) — ela é a única que permite revogar o acesso de UMA pessoa específica sem afetar as demais.

## Passo 3 — Revogar acesso de um comprador específico

Só é possível de forma limpa com a Opção B (Drive API). Fluxo:

```js
// listar permissões da pasta, achar a do e-mail do comprador, remover
const perms = await drive.permissions.list({ fileId: FOLDER_ID, fields: "permissions(id,emailAddress)" });
const alvo = perms.data.permissions.find(p => p.emailAddress === buyerEmail);
if (alvo) await drive.permissions.delete({ fileId: FOLDER_ID, permissionId: alvo.id });
```

Casos de uso: reembolso solicitado (ver skill `legal-compliance`), chargeback confirmado (ver skill `fraud-prevention`), ou suspeita fundamentada de redistribuição.

## Passo 4 — Se um vazamento for identificado

1. Não entre em pânico nem prometa "impossível vazar" para futuros compradores — seja realista na comunicação.
2. Se veio de um link único (Opção A): gere um novo link, revogue o antigo, e migre a entrega para Opção B se o volume de vendas justificar.
3. Se veio de um PDF com marca d'água: a marca identifica de qual comprador saiu a cópia — decisão de como agir (aviso, suspensão de acesso a futuras atualizações) é comercial/jurídica do usuário, não técnica.
4. Considere avisar nos Termos de Uso (skill `legal-compliance`) que cópias são rastreáveis — isso já ajuda a desincentivar preventivamente.

## Checklist

- [ ] PDFs entregues com marca d'água individual (e-mail do comprador)
- [ ] Geração da marca d'água automatizada no webhook, não manual
- [ ] Permissões do Drive configuradas como somente leitura
- [ ] Processo definido para revogar acesso individual (reembolso/chargeback)
- [ ] Termos de Uso mencionam rastreabilidade das cópias
