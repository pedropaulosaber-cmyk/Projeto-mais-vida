/*
 * Google Drive API — entrega Opção B (skill stripe-drive-checkout, Passo 5).
 *
 * Em vez de um link público único, a pasta mestre é compartilhada
 * individualmente com o e-mail de cada comprador (role "reader"). Isso é o
 * que viabiliza:
 *   - rastreabilidade (sabemos quem tem acesso);
 *   - revogação pontual em caso de reembolso/chargeback (skill fraud-prevention)
 *     ou vazamento (skill content-protection), sem afetar os demais compradores.
 *
 * Requer uma Service Account do Google Cloud com a Drive API ativada, e a
 * pasta mestre (DRIVE_FOLDER_ID) compartilhada com o e-mail da Service Account
 * como "Editor". Credenciais nunca commitadas — vêm de GOOGLE_SERVICE_ACCOUNT_JSON.
 */
import "server-only";
import { google } from "googleapis";
import { requireEnv } from "./env";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

function getServiceAccountCredentials(): Record<string, unknown> {
  const raw = requireEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON não é um JSON válido. Cole o JSON da Service Account em uma linha (ou base64, ver getServiceAccountCredentials).",
    );
  }
}

export function getDriveFolderId(): string {
  return requireEnv("DRIVE_FOLDER_ID");
}

let _drive: ReturnType<typeof google.drive> | null = null;

function getDrive() {
  if (!_drive) {
    const auth = new google.auth.GoogleAuth({
      credentials: getServiceAccountCredentials(),
      scopes: SCOPES,
    });
    _drive = google.drive({ version: "v3", auth });
  }
  return _drive;
}

/** Concede acesso de leitura à pasta mestre para o e-mail do comprador. */
export async function grantFolderAccess(buyerEmail: string): Promise<void> {
  const drive = getDrive();
  await drive.permissions.create({
    fileId: getDriveFolderId(),
    sendNotificationEmail: true,
    requestBody: {
      role: "reader",
      type: "user",
      emailAddress: buyerEmail,
    },
  });
}

/** Revoga o acesso de um e-mail específico (reembolso/chargeback/vazamento). */
export async function revokeFolderAccess(buyerEmail: string): Promise<void> {
  const drive = getDrive();
  const folderId = getDriveFolderId();

  const { data } = await drive.permissions.list({
    fileId: folderId,
    fields: "permissions(id,emailAddress)",
  });

  const match = data.permissions?.find(
    (p) => p.emailAddress?.toLowerCase() === buyerEmail.toLowerCase(),
  );

  if (!match?.id) return; // já não tem acesso — idempotente

  await drive.permissions.delete({
    fileId: folderId,
    permissionId: match.id,
  });
}
