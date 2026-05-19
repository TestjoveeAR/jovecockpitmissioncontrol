import { NextResponse } from "next/server";
import { trelloFetch } from "@/lib/trello";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.TRELLO_API_KEY || !process.env.TRELLO_API_TOKEN) {
    return NextResponse.json({ configured: false });
  }

  try {
    const boards: any[] = await trelloFetch("/members/me/boards?fields=name,url");
    let board = boards.find((b) => b.name === "Jovée Operations") ?? boards[0];

    if (!board) {
      return NextResponse.json({ configured: true, boards: [], lists: [], cards: [] });
    }

    const [lists, cards] = await Promise.all([
      trelloFetch(`/boards/${board.id}/lists?fields=name,pos&filter=open`),
      trelloFetch(`/boards/${board.id}/cards?fields=name,idList,labels,desc&filter=open`),
    ]);

    return NextResponse.json({ configured: true, board, boards, lists, cards });
  } catch (e: any) {
    return NextResponse.json(
      { configured: true, error: e?.message ?? "Trello fetch failed" },
      { status: 200 }
    );
  }
}
