/*
 * Cliente Google Drive API — ESQUELETO (Etapa 1). Entrega Opção B.
 *
 * Fluxo (skill stripe-drive-checkout, Passo 5 + content-protection):
 *   - Service Account com Drive API ativada; pasta mestre compartilhada com o
 *     e-mail da Service Account como editor.
 *   - Após pagamento confirmado no webhook: drive.permissions.create com
 *     role: "reader", type: "user", emailAddress: <comprador> → acesso individual,
 *     revogável (essencial para reembolso/chargeback e proteção de conteúdo).
 *
 * As credenciais vêm de GOOGLE_SERVICE_ACCOUNT_JSON (nunca commitadas). A
 * implementação real com googleapis entra na etapa de checkout.
 */
import "server-only";
import { requireEnv } from "./env";

export function getServiceAccountCredentials(): Record<string, unknown> {
  const raw = requireEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON não é um JSON válido. Cole o JSON da Service Account em uma linha.",
    );
  }
}

export function getDriveFolderId(): string {
  return requireEnv("DRIVE_FOLDER_ID");
}

// Placeholder. Será substituído pela inicialização real via googleapis:
//   const auth = new google.auth.GoogleAuth({ credentials, scopes: [...] });
//   export const drive = google.drive({ version: "v3", auth });
export async function grantFolderAccess(_buyerEmail: string): Promise<void> {
  throw new Error("Não implementado — esqueleto (Etapa 1).");
}

export async function revokeFolderAccess(_buyerEmail: string): Promise<void> {
  throw new Error("Não implementado — esqueleto (Etapa 1).");
}
