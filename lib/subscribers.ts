import "server-only";

import { auth, sheets } from "@googleapis/sheets";

function subscriberConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!spreadsheetId || !serviceAccountEmail || !privateKey) return null;

  return { spreadsheetId, serviceAccountEmail, privateKey };
}

export function subscriberSignupAvailable(): boolean {
  return subscriberConfig() !== null;
}

export async function appendSubscriber(email: string): Promise<void> {
  const config = subscriberConfig();
  if (!config) throw new Error("Email updates are not available yet.");

  const client = sheets({
    version: "v4",
    auth: new auth.JWT({
      email: config.serviceAccountEmail,
      key: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    }),
  });

  await client.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: "Subscribers!A:B",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[email, new Date().toISOString()]],
    },
  }, {
    retry: false,
    timeout: 10_000,
  });
}
