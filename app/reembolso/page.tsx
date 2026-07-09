import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Reembolso — DriveBooks",
  robots: { index: true, follow: true },
};

const SUPPORT_EMAIL = "adminebook.16@gmail.com";

export default function ReembolsoPage() {
  return (
    <LegalPageLayout title="Política de Reembolso" updatedAt="9 de julho de 2026">
      <LegalSection title="Garantia incondicional de 7 dias">
        <p>
          Você tem até <strong>7 (sete) dias corridos</strong>, contados a
          partir da data da compra, para solicitar o reembolso integral do
          valor pago — sem precisar justificar o motivo. Essa garantia segue o
          direito de arrependimento previsto no art. 49 do Código de Defesa do
          Consumidor para compras feitas fora de estabelecimento comercial
          (como é o caso de uma compra online).
        </p>
      </LegalSection>

      <LegalSection title="Como solicitar">
        <p>
          Envie um e-mail para{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> a partir do
          mesmo endereço usado na compra, informando o pedido de reembolso.
          Não é necessário formulário nem justificativa.
        </p>
      </LegalSection>

      <LegalSection title="Prazo e forma de devolução">
        <p>
          O reembolso é processado através da Stripe, pelo mesmo método de
          pagamento usado na compra, em até 7 dias úteis após a confirmação do
          pedido. O prazo para o valor aparecer no seu extrato pode variar
          conforme a instituição financeira/operadora do cartão.
        </p>
      </LegalSection>

      <LegalSection title="O que acontece com o acesso">
        <p>
          Ao processar o reembolso, o acesso à pasta do Google Drive é
          revogado para o e-mail correspondente. Isso não afeta o acesso de
          nenhum outro comprador.
        </p>
      </LegalSection>

      <LegalSection title="Após os 7 dias">
        <p>
          Passado o prazo de 7 dias da garantia incondicional, reembolsos
          deixam de ser automáticos e passam a ser avaliados caso a caso —
          entre em contato pelo e-mail acima para conversarmos.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
