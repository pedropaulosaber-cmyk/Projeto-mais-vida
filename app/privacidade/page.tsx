import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Privacidade — DriveBooks",
  robots: { index: true, follow: true },
};

const SUPPORT_EMAIL = "adminebook.16@gmail.com";

export default function PrivacidadePage() {
  return (
    <LegalPageLayout title="Política de Privacidade" updatedAt="9 de julho de 2026">
      <LegalSection title="1. Quem trata seus dados">
        <p>
          Esta política explica como a DriveBooks coleta, usa e protege seus
          dados pessoais, em conformidade com a Lei Geral de Proteção de Dados
          (LGPD — Lei nº 13.709/2018). Para exercer seus direitos ou tirar
          dúvidas sobre o tratamento dos seus dados, entre em contato pelo{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Quais dados coletamos">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>
            <strong>Dados de compra:</strong> e-mail informado no checkout
            (usado para liberar o acesso à biblioteca), coletados e
            processados diretamente pela Stripe — não armazenamos dados de
            cartão de crédito em nossos servidores.
          </li>
          <li>
            <strong>Dados de navegação:</strong> páginas visitadas, cliques em
            botões, tempo na página e profundidade de rolagem, para entender
            como o site é usado e melhorar a experiência.
          </li>
          <li>
            <strong>Cookies e identificadores publicitários:</strong>{" "}
            utilizamos o Meta Pixel (Facebook/Instagram Ads) e parâmetros de
            campanha (UTM) para medir a eficácia dos nossos anúncios.
          </li>
          <li>
            <strong>Endereço IP:</strong> usado de forma técnica e temporária
            para prevenir abuso (limite de requisições) — não é associado a
            perfis de navegação de longo prazo.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para que usamos seus dados">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Processar seu pagamento e liberar o acesso ao produto comprado;</li>
          <li>Enviar e-mails transacionais (confirmação de compra, acesso, suporte);</li>
          <li>Medir e otimizar o desempenho de campanhas publicitárias;</li>
          <li>Cumprir obrigações legais e prevenir fraude.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Com quem compartilhamos">
        <p>Compartilhamos dados apenas com prestadores de serviço necessários à operação do negócio:</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong>Stripe</strong> — processamento de pagamento;</li>
          <li><strong>Google (Drive/Service Account)</strong> — entrega do produto;</li>
          <li><strong>Resend</strong> — envio de e-mails transacionais;</li>
          <li><strong>Meta (Facebook/Instagram)</strong> — mensuração de anúncios, via Pixel e Conversions API.</li>
        </ul>
        <p>Não vendemos seus dados pessoais a terceiros.</p>
      </LegalSection>

      <LegalSection title="5. Seus direitos (LGPD, art. 18)">
        <p>Você pode, a qualquer momento, solicitar:</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>Correção de dados incompletos ou desatualizados;</li>
          <li>Eliminação dos dados tratados com seu consentimento;</li>
          <li>Informação sobre com quem compartilhamos seus dados.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, entre em contato por{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="6. Retenção de dados">
        <p>
          Dados de compra são mantidos pelo prazo exigido pela legislação
          fiscal e de defesa do consumidor. Dados de navegação/cookies são
          mantidos por até 12 meses, salvo obrigação legal de prazo diferente.
        </p>
      </LegalSection>

      <LegalSection title="7. Alterações desta política">
        <p>
          Podemos atualizar esta política periodicamente. A data de "última
          atualização" no topo indica a versão vigente.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
