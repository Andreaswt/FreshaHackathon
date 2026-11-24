import type { BankState, Invoice, LineItem, ToolLog } from "./types";

const SEED: BankState = {
  balance: 4250,
  payees: [
    { id: "p1", name: "Tom Baker", sortCode: "20-45-11", account: "41557203" },
    { id: "p2", name: "Sarah Lee", sortCode: "40-11-62", account: "73920154" },
    { id: "p3", name: "Office Supplies Ltd", sortCode: "30-90-89", account: "11873420" },
  ],
  clients: [
    { id: "c1", name: "Acme Ltd", email: null, address: "Unit 4, Riverside Park, Leeds LS1 4AP" },
    { id: "c2", name: "Brightside Studio", email: "hello@brightside.studio", address: "22 Canal Street, Manchester M1 3HE" },
    { id: "c3", name: "Nova Cafe", email: "orders@novacafe.co.uk", address: "9 Market Row, Bristol BS1 1JQ" },
  ],
  invoices: [
    {
      id: "INV-1001",
      clientId: "c2",
      amount: 1200,
      description: "Brand refresh",
      lineItems: [
        { description: "Logo redesign", quantity: 1, unitPrice: 650 },
        { description: "Brand guidelines (pages)", quantity: 10, unitPrice: 55 },
      ],
      issuedAt: "2026-10-28T09:00:00.000Z",
      dueAt: "2026-11-11T09:00:00.000Z",
      status: "sent",
    },
    {
      id: "INV-1002",
      clientId: "c3",
      amount: 480,
      description: "Winter menu design",
      lineItems: [
        { description: "Menu layout (hours)", quantity: 8, unitPrice: 45 },
        { description: "Print-ready files", quantity: 1, unitPrice: 120 },
      ],
      issuedAt: "2026-11-04T09:00:00.000Z",
      dueAt: "2026-11-18T09:00:00.000Z",
      status: "sent",
    },
    {
      id: "INV-1003",
      clientId: "c1",
      amount: 2150,
      description: "Website build, phase 1",
      lineItems: [
        { description: "Design days", quantity: 3, unitPrice: 450 },
        { description: "Development days", quantity: 2, unitPrice: 400 },
      ],
      issuedAt: "2026-11-19T09:00:00.000Z",
      dueAt: "2026-12-03T09:00:00.000Z",
      status: "draft",
    },
  ],
  transactions: [
    { id: "tx_2", payeeId: "p3", amount: 86.4, reference: "Printer ink", at: "2026-11-21T10:12:00.000Z" },
    { id: "tx_1", payeeId: "p2", amount: 350, reference: "Logo design", at: "2026-11-18T15:40:00.000Z" },
  ],
  handoffs: [],
};

/** Business details printed on every invoice. Fictional. */
export const BUSINESS = {
  name: "Sam Rivers Design",
  address: "14 Kiln Lane, Brighton BN1 6QT",
  email: "sam@samriversdesign.co.uk",
  sortCode: "04-00-75",
  account: "28461937",
};

export const lineTotal = (items: LineItem[]) => round2(items.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));

/** True when the invoice has line items and they don't add up to its total. */
export const invoiceDoesntAddUp = (inv: Pick<Invoice, "amount" | "lineItems">) =>
  inv.lineItems.length > 0 && Math.abs(lineTotal(inv.lineItems) - inv.amount) >= 0.01;

function parseLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => ({
      description: String(l?.description ?? "Item"),
      quantity: toAmount(l?.quantity ?? 1) || 1,
      unitPrice: toAmount(l?.unit_price ?? l?.unitPrice ?? 0),
    }))
    .filter((l) => Number.isFinite(l.unitPrice));
}

export const seedState = (): BankState => structuredClone(SEED);

export const money = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function findByName<T extends { name: string }>(list: T[], raw: string): T | undefined {
  const q = norm(raw);
  if (!q) return undefined;
  return (
    list.find((x) => norm(x.name) === q) ??
    list.find((x) => norm(x.name).includes(q) || q.includes(norm(x.name))) ??
    list.find((x) => norm(x.name).split(" ")[0] === q.split(" ")[0])
  );
}

const toAmount = (v: unknown) => Number(String(v ?? "").replace(/[£,\s]/g, ""));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pure: never mutates `prev`. */
export function runTool(
  prev: BankState,
  name: string,
  input: Record<string, unknown>,
): { state: BankState; log: ToolLog } {
  const state = structuredClone(prev);
  const fail = (error: string) => ({ state: prev, log: { name, input, output: { ok: false, error }, ok: false } });
  const ok = (output: Record<string, unknown>) => ({ state, log: { name, input, output: { ok: true, ...output }, ok: true } });

  switch (name) {
    case "get_balance":
      return ok({ balance: state.balance, currency: "GBP" });

    case "pay": {
      const payee = findByName(state.payees, String(input.payee_name ?? ""));
      const amount = toAmount(input.amount);
      if (!payee)
        return fail(`No payee called "${input.payee_name}". Known payees: ${state.payees.map((p) => p.name).join(", ")}.`);
      if (!(amount > 0)) return fail("Amount must be more than £0.");
      if (amount > state.balance) return fail("Not enough money in the account.");
      state.balance = round2(state.balance - amount);
      const tx = {
        id: `tx_${state.transactions.length + 1}`,
        payeeId: payee.id,
        amount,
        reference: String(input.reference ?? ""),
        at: new Date().toISOString(),
      };
      state.transactions.unshift(tx);
      return ok({ transaction_id: tx.id, payee: payee.name, amount, new_balance: state.balance });
    }

    case "create_invoice": {
      const client = findByName(state.clients, String(input.client_name ?? ""));
      const amount = toAmount(input.amount);
      if (!client)
        return fail(`No client called "${input.client_name}". Known clients: ${state.clients.map((c) => c.name).join(", ")}.`);
      if (!(amount > 0)) return fail("Amount must be more than £0.");
      const now = new Date();
      const days = toAmount(input.due_in_days) || 14;
      const inv: Invoice = {
        id: `INV-${1001 + state.invoices.length}`,
        clientId: client.id,
        amount: round2(amount),
        description: String(input.description ?? ""),
        lineItems: parseLineItems(input.line_items),
        issuedAt: now.toISOString(),
        dueAt: new Date(now.getTime() + days * 86_400_000).toISOString(),
        status: "draft",
      };
      state.invoices.push(inv);
      return ok({ invoice_id: inv.id, client: client.name, amount: inv.amount, line_items: inv.lineItems.length, status: "draft" });
    }

    case "list_invoices": {
      const client = input.client_name ? findByName(state.clients, String(input.client_name)) : undefined;
      const list = state.invoices.filter((i) => !client || i.clientId === client.id);
      return ok({
        invoices: list.map((i) => ({
          invoice_id: i.id,
          client: state.clients.find((c) => c.id === i.clientId)?.name,
          amount: i.amount,
          description: i.description,
          line_items: i.lineItems.map((l) => ({ description: l.description, quantity: l.quantity, unit_price: l.unitPrice })),
          issued: i.issuedAt.slice(0, 10),
          status: i.status,
        })),
      });
    }

    case "send_invoice": {
      const id = String(input.invoice_id ?? "").toUpperCase();
      const inv = state.invoices.find((i) => i.id.toUpperCase() === id);
      if (!inv) return fail(`No invoice with id "${input.invoice_id}".`);
      const client = state.clients.find((c) => c.id === inv.clientId)!;
      if (!client.email) return fail(`${client.name} has no email address on file, so the invoice could not be sent.`);
      if (inv.status === "sent") return fail(`Invoice ${inv.id} was already sent.`);
      inv.status = "sent";
      return ok({ invoice_id: inv.id, sent_to: client.email });
    }

    case "handoff_to_human": {
      state.handoffs.push({ reason: String(input.reason ?? ""), at: new Date().toISOString() });
      return ok({ message: "A member of the ANNA team will join this chat shortly." });
    }

    default:
      return fail(`Unknown tool "${name}".`);
  }
}

export const TOOL_DEFS = [
  {
    type: "function" as const,
    function: {
      name: "get_balance",
      description: "Get the current account balance in GBP.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "pay",
      description: "Send money to an existing payee. Moves money immediately and cannot be undone.",
      parameters: {
        type: "object",
        properties: {
          payee_name: { type: "string", description: "Name of an existing payee" },
          amount: { type: "number", description: "Amount in GBP" },
          reference: { type: "string", description: "Payment reference" },
        },
        required: ["payee_name", "amount", "reference"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_invoice",
      description: "Create a DRAFT invoice for an existing client. Does not send it.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string" },
          amount: { type: "number", description: "Invoice total in GBP" },
          description: { type: "string" },
          line_items: {
            type: "array",
            description: "Optional breakdown. The total should equal the sum of quantity x unit_price.",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number", description: "GBP per unit" },
              },
              required: ["description", "quantity", "unit_price"],
            },
          },
          due_in_days: { type: "number", description: "Payment terms in days, default 14" },
        },
        required: ["client_name", "amount", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_invoices",
      description: "List past and draft invoices, optionally for one client, with their line items.",
      parameters: {
        type: "object",
        properties: { client_name: { type: "string", description: "Optional client filter" } },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_invoice",
      description: "Email an existing invoice to the client. Fails if the client has no email on file.",
      parameters: {
        type: "object",
        properties: { invoice_id: { type: "string", description: "e.g. INV-1002" } },
        required: ["invoice_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "handoff_to_human",
      description: "Hand the conversation over to a human member of the ANNA support team.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string" } },
        required: ["reason"],
      },
    },
  },
];
