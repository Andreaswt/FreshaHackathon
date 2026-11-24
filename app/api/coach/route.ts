import { runChecks } from "@/lib/checks";
import { fallbackVerdict, runCoach } from "@/lib/coach";
import { MISSIONS } from "@/lib/missions";
import type { BankState, ChatMsg, ToolLog } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    missionId: string;
    chat: ChatMsg[];
    tools: ToolLog[];
    before: BankState;
    after: BankState;
    failedTries: number;
    backdoor?: string;
  };
  const mission = MISSIONS.find((m) => m.id === body.missionId) ?? MISSIONS[0];
  const findings = runChecks(body.chat, body.tools, body.after);
  let verdict = await runCoach({ ...body, mission, findings });
  // Demo backdoors are known bugs: never let a cautious coach miss them on stage.
  if (body.backdoor) {
    const known = fallbackVerdict(mission, findings, body.failedTries);
    if (known.broke && !verdict.broke) verdict = known;
    else if (known.broke) verdict = { ...verdict, on_mission: verdict.on_mission || known.on_mission };
  }
  return Response.json({ ...verdict, findings });
}
