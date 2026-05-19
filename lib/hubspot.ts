import { Client } from "@hubspot/api-client";

export function getHubspotClient(): Client | null {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) return null;
  return new Client({ accessToken: token });
}

export async function pingHubspot(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getHubspotClient();
    if (!client) return { ok: false, error: "No HUBSPOT_PRIVATE_APP_TOKEN set" };
    await client.crm.contacts.basicApi.getPage(1);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
