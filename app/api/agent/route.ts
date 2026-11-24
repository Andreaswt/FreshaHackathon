import { runAgentTurn } from "@/lib/agent";
import { tryBackdoor } from "@/lib/backdoors";
import type { BankState, LlmMsg } from "@/lib/types";

export async function POST(req: Request) {
  const { state, history, message } = (await req.json()) as { state: BankState; history: LlmMsg[]; message: string };
  try {
    const demo = tryBackdoor(state, history, message);
    if (demo) {
      await new Promise((r) => setTimeout(r, 1400)); // feel like a real model reply
      return Response.json(demo);
    }
    return Response.json(await runAgentTurn(state, history, message));
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[agent]", error);
    return Response.json({ error }, { status: 500 });
  }
}
