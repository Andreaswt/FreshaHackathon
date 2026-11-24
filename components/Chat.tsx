"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/bank";
import type { BankState, ChatMsg, ToolLog } from "@/lib/types";
import { AccountChip } from "./AccountChip";
import { InvoiceModal } from "./InvoiceModal";

const spring = { type: "spring" as const, stiffness: 380, damping: 28 };

function toolChip(t: ToolLog): { icon: string; label: string; ok: boolean; invoiceId?: string } | null {
  const o = t.output;
  switch (t.name) {
    case "pay":
      return t.ok
        ? { icon: "💸", label: `Paid ${o.payee} ${money(Number(o.amount))}`, ok: true }
        : { icon: "💸", label: "Payment didn't go through", ok: false };
    case "create_invoice":
      return t.ok
        ? { icon: "🧾", label: `Draft invoice for ${o.client} · ${money(Number(o.amount))}`, ok: true, invoiceId: String(o.invoice_id) }
        : { icon: "🧾", label: "Couldn't create invoice", ok: false };
    case "send_invoice": {
      const invoiceId = String(t.input.invoice_id ?? "").toUpperCase() || undefined;
      return t.ok ? { icon: "✉️", label: "Invoice emailed", ok: true, invoiceId } : { icon: "✉️", label: "Invoice not sent", ok: false, invoiceId };
    }
    case "list_invoices":
      return { icon: "📂", label: "Looked up invoices", ok: t.ok };
    case "handoff_to_human":
      return { icon: "🙋", label: "Handed to a human", ok: t.ok };
    case "get_balance":
      return { icon: "👀", label: "Checked balance", ok: t.ok };
    default:
      return null;
  }
}

function Avatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lavender to-[#c3b8ff] text-base font-black text-white shadow-softer">
      A
    </div>
  );
}

export function Chat({
  chat,
  bank,
  annaTyping,
  input,
  setInput,
  onSend,
  onRetry,
  locked,
  pulse,
  emptyHint,
  onWarmup,
}: {
  chat: ChatMsg[];
  bank: BankState;
  annaTyping: boolean;
  input: string;
  setInput: (s: string) => void;
  onSend: (text: string) => void;
  onRetry?: (msgId: string) => void;
  locked: boolean;
  pulse: number;
  emptyHint?: string;
  /** Offer to start mid-conversation (only while the chat is empty). */
  onWarmup?: () => void;
}) {
  const lastWarmup = chat.findLastIndex((m) => m.warmup);
  const bottom = useRef<HTMLDivElement>(null);
  const [viewInvoice, setViewInvoice] = useState<string | null>(null);
  const hasInvoice = (id?: string) => !!id && bank.invoices.some((i) => i.id === id);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, annaTyping]);

  useEffect(() => {
    if (!locked) inputRef.current?.focus();
  }, [locked]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-line bg-white shadow-soft">
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar />
          <div>
            <p className="text-[15px] leading-tight font-black">ANNA</p>
            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <span className="h-2 w-2 rounded-full bg-[#5ccf9a]" /> Business assistant
            </p>
          </div>
        </div>
        <AccountChip bank={bank} onOpenInvoice={setViewInvoice} />
      </div>

      {/* messages */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#fffcfa] px-5 py-5">
        <AnimatePresence mode="popLayout">
          {chat.length === 0 && !annaTyping && emptyHint && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center pt-16 text-center"
            >
              <p className="text-4xl">👋</p>
              <p className="mt-2 max-w-xs text-[15px] font-bold text-muted">{emptyHint}</p>
              {onWarmup && (
                <>
                  <p className="mt-5 text-xs font-extrabold tracking-wide text-muted/70 uppercase">or</p>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onWarmup}
                    className="mt-3 rounded-full border border-lavender bg-lavender/30 px-5 py-2.5 text-[14px] font-extrabold text-lavender-deep hover:bg-lavender/50"
                  >
                    ✨ Continue an existing conversation
                  </motion.button>
                  <p className="mt-2 max-w-xs text-xs font-semibold text-muted">
                    We&apos;ll make up a few earlier messages. Some tricks only work once ANNA has some history.
                  </p>
                </>
              )}
            </motion.div>
          )}
          {chat.flatMap((m, idx) => [
            ...(idx === 0 && m.warmup
              ? [
                  <motion.div key="earlier" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center gap-3 text-[11px] font-extrabold tracking-wide text-muted/80 uppercase">
                    <span className="h-px flex-1 bg-line" /> Earlier conversation · made up <span className="h-px flex-1 bg-line" />
                  </motion.div>,
                ]
              : []),
            m.role === "user" ? (
              <motion.div
                layout
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                transition={spring}
                className={`group mb-3 flex items-center justify-end gap-2 ${m.warmup ? "opacity-60" : ""}`}
              >
                {onRetry && !locked && !m.warmup && (
                  <button
                    onClick={() => onRetry(m.id)}
                    className="rounded-full px-2.5 py-1 text-xs font-bold text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-lavender/40 hover:text-ink"
                  >
                    ↺ Retry from here
                  </button>
                )}
                <div className="max-w-[78%] rounded-[20px] rounded-br-md bg-lavender px-4 py-2.5 text-[15px] font-semibold text-ink">
                  {m.text}
                </div>
              </motion.div>
            ) : (
              <motion.div
                layout
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                transition={spring}
                className={`mb-3 flex items-end gap-2.5 ${m.warmup ? "opacity-60" : ""}`}
              >
                <Avatar />
                <div className="max-w-[78%]">
                  <motion.div
                    animate={
                      m.caught
                        ? { boxShadow: "0 0 0 3px rgba(255,138,128,0.55), 0 0 28px 4px rgba(255,138,128,0.35)", borderColor: "#FF8A80" }
                        : { boxShadow: "0 0 0 0px rgba(255,138,128,0)", borderColor: "#F1E6E1" }
                    }
                    transition={{ duration: 0.6 }}
                    className="relative rounded-[20px] rounded-bl-md border bg-white px-4 py-2.5 text-[15px] font-semibold text-ink"
                  >
                    {m.text}
                    <AnimatePresence>
                      {m.caught && (
                        <motion.span
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 6 }}
                          transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.2 }}
                          className="absolute -top-3 -right-3 rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-black text-white shadow-softer"
                        >
                          🎯 caught
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {!!m.tools?.length && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {m.tools.map((t, i) => {
                        const c = toolChip(t);
                        if (!c) return null;
                        const color = c.ok ? "bg-mint/70 text-[#2c7a5a]" : "bg-coral-soft text-[#c4554b]";
                        if (hasInvoice(c.invoiceId))
                          return (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ ...spring, delay: 0.15 + i * 0.08 }}
                              onClick={() => setViewInvoice(c.invoiceId!)}
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-current/15 ${color}`}
                            >
                              {c.icon} {c.label} <span className="underline decoration-2 underline-offset-2">View ›</span>
                            </motion.button>
                          );
                        return (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...spring, delay: 0.15 + i * 0.08 }}
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${color}`}
                          >
                            {c.icon} {c.label}
                          </motion.span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ),
            ...(idx === lastWarmup && !locked && (idx === chat.length - 1 || !chat[idx + 1].warmup)
              ? [
                  <motion.div key="your-turn" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center gap-3 text-[11px] font-extrabold tracking-wide text-lavender-deep uppercase">
                    <span className="h-px flex-1 bg-lavender" /> Your turn <span className="h-px flex-1 bg-lavender" />
                  </motion.div>,
                ]
              : []),
          ])}
          {annaTyping && (
            <motion.div
              layout
              key="typing"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={spring}
              className="mb-3 flex items-end gap-2.5"
            >
              <Avatar />
              <div className="flex gap-1.5 rounded-[20px] rounded-bl-md border border-line bg-white px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-muted/60"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottom} />
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked && input.trim()) onSend(input.trim());
        }}
        className="border-t border-line px-4 py-3.5"
      >
        <motion.div
          key={pulse}
          initial={pulse ? { boxShadow: "0 0 0 0px rgba(217,210,255,0.9)" } : false}
          animate={pulse ? { boxShadow: ["0 0 0 0px rgba(217,210,255,0.9)", "0 0 0 10px rgba(217,210,255,0)", "0 0 0 0px rgba(217,210,255,0.9)", "0 0 0 10px rgba(217,210,255,0)"] } : {}}
          transition={{ duration: 1.8 }}
          className={`flex items-center gap-2 rounded-full border-2 bg-cream py-1.5 pr-1.5 pl-5 transition-colors ${locked ? "border-transparent" : "border-lavender/70 focus-within:border-lavender-deep/50"}`}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={locked}
            placeholder={locked ? "" : "Type a message..."}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-muted/70"
          />
          <motion.button
            type="submit"
            disabled={locked || !input.trim()}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender-deep text-white shadow-softer disabled:opacity-40"
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </motion.div>
      </form>
      <InvoiceModal invoiceId={viewInvoice} bank={bank} onClose={() => setViewInvoice(null)} />
    </div>
  );
}
