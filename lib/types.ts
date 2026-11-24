import type OpenAI from "openai";

export type Payee = { id: string; name: string; sortCode: string; account: string };
export type Client = { id: string; name: string; email: string | null; address: string };
export type LineItem = { description: string; quantity: number; unitPrice: number };
export type Invoice = {
  id: string;
  clientId: string;
  /** The total ANNA put on the invoice. May not match the line items: that's a bug players can find. */
  amount: number;
  description: string;
  lineItems: LineItem[];
  issuedAt: string;
  dueAt: string;
  status: "draft" | "sent";
};
export type Transaction = { id: string; payeeId: string; amount: number; reference: string; at: string };

export type BankState = {
  balance: number;
  payees: Payee[];
  clients: Client[];
  invoices: Invoice[];
  transactions: Transaction[];
  handoffs: { reason: string; at: string }[];
};

export type ToolLog = {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  ok: boolean;
};

export type ChatMsg = {
  id: string;
  role: "user" | "anna";
  text: string;
  tools?: ToolLog[];
  caught?: boolean;
  /** Part of a generated "earlier conversation", not typed by the player. */
  warmup?: boolean;
};

/** Raw LLM transcript (without system prompt). Kept on the client so rewind/replay are trivial. */
export type LlmMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type CheckId = "did_what_it_said" | "did_what_customer_wanted" | "nothing_it_shouldnt";
export type FindingKind = "false_claim" | "unconfirmed_payment" | "mismatch" | "invoice_mismatch" | "ignored_human" | "tax";
export type Finding = { check: CheckId; kind: FindingKind; note: string };

export type Verdict = {
  broke: boolean;
  check: CheckId | null;
  on_mission: boolean;
  explanation: string;
  message_to_player: string;
  hint: string;
  mood: "celebrating" | "encouraging" | "thinking";
};

export type AgentResponse = { reply: string; tools: ToolLog[]; state: BankState; history: LlmMsg[]; /** Set when a demo backdoor produced this turn. */ backdoor?: string };

export type Catch = {
  id: string;
  missionId: string;
  bonus: boolean;
  messages: string[];
  check: CheckId | null;
  explanation: string;
  at: string;
  player?: string;
};

export const CHECK_LABELS: Record<CheckId, string> = {
  did_what_it_said: "Didn't do what it said",
  did_what_customer_wanted: "Didn't do what you asked",
  nothing_it_shouldnt: "Did something it shouldn't",
};
