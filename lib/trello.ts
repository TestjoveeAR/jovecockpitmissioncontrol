const TRELLO_BASE = "https://api.trello.com/1";

function creds() {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_API_TOKEN;
  if (!key || !token) return null;
  return { key, token };
}

export async function trelloFetch(path: string, init?: RequestInit) {
  const c = creds();
  if (!c) throw new Error("Trello credentials missing");
  const url = new URL(`${TRELLO_BASE}${path}`);
  url.searchParams.set("key", c.key);
  url.searchParams.set("token", c.token);
  const res = await fetch(url.toString(), { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`Trello ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function pingTrello(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!creds()) return { ok: false, error: "No Trello key/token set" };
    await trelloFetch("/members/me");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
