import * as postmark from "postmark";

let client: postmark.ServerClient | null = null;

function getClient(): postmark.ServerClient {
  if (!client) {
    client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN || "");
  }
  return client;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  htmlBody: string;
  from?: string;
}) {
  const pmClient = getClient();
  return pmClient.sendEmail({
    From: options.from || "notifications@tripwise.app",
    To: options.to,
    Subject: options.subject,
    HtmlBody: options.htmlBody,
  });
}

export function verifyWebhookSecret(providedSecret: string): boolean {
  const expected = process.env.POSTMARK_INBOUND_WEBHOOK_SECRET;
  if (!expected) return true; // Skip verification if not configured
  return providedSecret === expected;
}
