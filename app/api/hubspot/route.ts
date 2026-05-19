import { NextResponse } from "next/server";
import { getHubspotClient } from "@/lib/hubspot";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = getHubspotClient();
  if (!client) {
    return NextResponse.json({ configured: false, deals: [], pipelines: [] });
  }

  try {
    // Fetch all deals + pipelines. Hubspot deals carry a "dealstage" property.
    const [dealsRes, pipelinesRes] = await Promise.all([
      client.crm.deals.basicApi.getPage(100, undefined, [
        "dealname",
        "dealstage",
        "pipeline",
        "amount",
        "closedate",
      ]),
      client.crm.pipelines.pipelinesApi.getAll("deals"),
    ]);

    return NextResponse.json({
      configured: true,
      deals: dealsRes.results,
      pipelines: pipelinesRes.results,
    });
  } catch (e: any) {
    return NextResponse.json(
      { configured: true, error: e?.message ?? "Hubspot fetch failed", deals: [], pipelines: [] },
      { status: 200 }
    );
  }
}
