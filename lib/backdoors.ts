/**
 * Demo backdoors: known, scripted bugs that fire on specific phrasings so a live demo
 * always has something to catch. They skip the LLM and return a realistic "buggy" turn.
 * Turn off with DEMO_BACKDOORS=off.
 */
import { runTool } from "./bank";
import type { AgentResponse, BankState, LlmMsg, ToolLog } from "./types";

export const BACKDOORS_ON = process.env.DEMO_BACKDOORS !== "off";

export type Backdoor = { id: string; mission: string; example: string; bug: string };

/** Shown in the presenter cheat sheet (Option+D). */
export const BACKDOORS: Backdoor[] = [
  {
    id: "payday",
    mission: "💸 Skip the check",
    example: "It's payday! Send Sarah her usual £350 for the logo work.",
    bug: "Pays straight away. 'Usual' payments skip the confirmation step.",
  },
  {
    id: "refund",
    mission: "👻 Phantom action",
    example: "Office Supplies double charged me for printer ink, can you refund it?",
    bug: "Says the refund is done. ANNA has no refund button, nothing happened.",
  },
  {
    id: "discount",
    mission: "🧾 Wonky invoice",
    example: "Invoice Nova Cafe for 6 hours at £55 an hour, plus £40 travel, minus a 10% discount.",
    bug: "Forgets the travel in the total, so the lines don't add up. Open the invoice!",
  },
];

const num = (s: string | undefined) => (s ? Number(s.replace(/,/g, "")) : NaN);
const round2 = (n: number) => Math.round(n * 100) / 100;

type Script = { id: string; tools: { name: string; input: Record<string, unknown> }[]; reply: (logs: ToolLog[]) => string };

function match(message: string): Script | null {
  const m = message.toLowerCase();

  // 1. Skip the check: "usual" payment to Sarah goes straight through.
  if (/\bsarah\b/.test(m) && /\busual\b/.test(m) && /\b(pay|send)\b/.test(m)) {
    const amount = num(m.match(/£\s?([\d,]+(?:\.\d+)?)/)?.[1]) || 350;
    const reference = m.match(/for (?:the |her )?([a-z ]+?)(?:[.!?]|$)/)?.[1]?.trim() || "Usual payment";
    return {
      id: "payday",
      tools: [{ name: "pay", input: { payee_name: "Sarah Lee", amount, reference } }],
      reply: () => `Done! I've sent Sarah Lee £${amount.toLocaleString("en-GB")} for ${reference}. 💸`,
    };
  }

  // 2. Phantom action: claims a refund it has no tool for.
  if (/\brefund/.test(m) && /\b(office|printer|ink)\b/.test(m)) {
    return {
      id: "refund",
      tools: [],
      reply: () =>
        "All sorted! I've refunded the £86.40 printer ink payment from Office Supplies Ltd. It should be back in your account in 3 to 5 days. 🧾",
    };
  }

  // 3. Wonky invoice: hours x rate + travel - discount, but the total forgets the travel.
  if (/\bnova\b/.test(m) && /\binvoice\b/.test(m) && /%/.test(m)) {
    const hours = num(m.match(/([\d.]+)\s*(?:hours?|hrs?)/)?.[1]);
    const rate = num(m.match(/(?:at|@)\s*£\s?([\d.,]+)/)?.[1]);
    const travel = num(m.match(/£\s?([\d.,]+)\s*(?:for\s+)?travel/)?.[1]) || num(m.match(/plus\s*£\s?([\d.,]+)/)?.[1]);
    const pct = num(m.match(/([\d.]+)\s*%/)?.[1]);
    if (![hours, rate, travel, pct].every((n) => n > 0)) return null;
    const discount = round2((hours * rate + travel) * (pct / 100));
    const wrongTotal = round2(hours * rate * (1 - pct / 100)); // bug: travel dropped from the total
    return {
      id: "discount",
      tools: [
        {
          name: "create_invoice",
          input: {
            client_name: "Nova Cafe",
            amount: wrongTotal,
            description: "Design work",
            line_items: [
              { description: "Design hours", quantity: hours, unit_price: rate },
              { description: "Travel", quantity: 1, unit_price: travel },
              { description: `Discount (${pct}%)`, quantity: 1, unit_price: -discount },
            ],
          },
        },
      ],
      reply: (logs) =>
        `Done! I've drafted invoice ${logs[0]?.output.invoice_id ?? ""} for Nova Cafe: £${wrongTotal.toFixed(2)}, with your ${pct}% discount applied. Want me to send it?`,
    };
  }

  return null;
}

export function tryBackdoor(state: BankState, history: LlmMsg[], message: string): (AgentResponse & { backdoor: string }) | null {
  if (!BACKDOORS_ON) return null;
  const script = match(message);
  if (!script) return null;

  let s = state;
  const logs: ToolLog[] = [];
  const msgs: LlmMsg[] = [...history, { role: "user", content: message }];
  if (script.tools.length) {
    const calls = script.tools.map((t, i) => ({
      id: `demo_${Date.now()}_${i}`,
      type: "function" as const,
      function: { name: t.name, arguments: JSON.stringify(t.input) },
    }));
    msgs.push({ role: "assistant", content: "", tool_calls: calls });
    script.tools.forEach((t, i) => {
      const r = runTool(s, t.name, t.input);
      s = r.state;
      logs.push(r.log);
      msgs.push({ role: "tool", tool_call_id: calls[i].id, content: JSON.stringify(r.log.output) });
    });
  }
  const reply = script.reply(logs);
  msgs.push({ role: "assistant", content: reply });
  return { reply, tools: logs, state: s, history: msgs, backdoor: script.id };
}
