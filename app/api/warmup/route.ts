import { MISSIONS } from "@/lib/missions";
import { warmupMessages } from "@/lib/warmup";

export async function POST(req: Request) {
  const { missionId } = (await req.json().catch(() => ({}))) as { missionId?: string };
  return Response.json(await warmupMessages(MISSIONS.find((m) => m.id === missionId)));
}
