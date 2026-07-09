import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Termos de Uso — DriveBooks",
  robots: { index: true, follow: true },
};

/*
 * ATENÇÃO: o campo de identificação do vendedor abaixo está com placeholder
 * (o usuário ainda não definiu se vende como pessoa física ou CNPJ). O CDC
 * (art. 31) exige essa identificação clara — preencher antes de escalar.
 */
const SELLER_IDENTIFICATION =
  "[a preencher: nome completo ou razão social do vendedor responsável pela DriveBooks]";
const SUPPORT_EMAIL = "adminebook.16@gmail.com";

export default function TermosPage() {
  return (
    <LegalPageLayout title="Termos de Uso" updatedAt="9 de julho de 2026">
      <LegalSection title="1. Quem somos">
        <p>
          A DriveBooks é um produto digital operado por {SELLER_IDENTIFICATION}
          ("nós"), que disponibiliza acesso a uma biblioteca de livros digitais
          através de uma pasta compartilhada do Google Drive. Dúvidas ou
          contato: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. O produto">
        <p>
          Ao comprar, você recebe acesso individual (vinculado ao e-mail usado
          na compra) a uma pasta do Google Drive contendo mais de 1.500 livros
          digitais, organizados por categoria. O acesso é vitalício: uma vez
          concedido, permanece ativo indefinidamente, salvo nas hipóteses de
          reembolso ou uso indevido descritas nestes Termos.
        </p>
        <p>
          A entrega é automática: assim que o pagamento é confirmado pela
          Stripe, o acesso é liberado e um e-mail de confirmação é enviado —
          normalmente em poucos minutos.
        </p>
      </LegalSection>

      <LegalSection title="3. Pagamento">
        <p>
          O pagamento é processado exclusivamente pela Stripe, em parcela
          única, no valor exibido na página de compra no momento da
          transação. Não há cobrança recorrente, mensalidade ou renovação
          automática.
        </p>
      </LegalSection>

      <LegalSection title="4. Uso permitido e propriedade intelectual">
        <p>
          O acesso concedido é pessoal e intransferível. É proibido
          compartilhar o link/convite da pasta, redistribuir os arquivos,
          revender o acesso ou disponibilizá-lo publicamente. O uso indevido
          pode resultar na revogação do acesso, sem reembolso, sem prejuízo de
          outras medidas cabíveis.
        </p>
        <p>
          A DriveBooks não é afiliada, patrocinada nem endossada pelo Google.
          "Google Drive" é marca da Google LLC, citada apenas como meio de
          entrega do produto.
        </p>
      </LegalSection>

      <LegalSection title="5. Reembolso e garantia">
        <p>
          Você tem 7 dias corridos, a partir da data da compra, para solicitar
          reembolso integral, sem necessidade de justificativa — conforme o
          direito de arrependimento previsto no art. 49 do Código de Defesa do
          Consumidor para compras realizadas fora do estabelecimento
          comercial. Veja os detalhes na nossa{" "}
          <a href="/reembolso">Política de Reembolso</a>.
        </p>
      </LegalSection>

      <LegalSection title="6. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos a qualquer momento, para refletir
          mudanças no produto ou na legislação. A data de "última atualização"
          no topo desta página indica a versão vigente.
        </p>
      </LegalSection>

      <LegalSection title="7. Legislação aplicável">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do
          Brasil, incluindo o Código de Defesa do Consumidor (Lei nº
          8.078/1990) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
