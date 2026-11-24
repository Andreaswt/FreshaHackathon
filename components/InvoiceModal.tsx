"use client";

import { AnimatePresence, motion, useMotionValueEvent, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { BUSINESS, invoiceDoesntAddUp, lineTotal, money } from "@/lib/bank";
import type { BankState, Invoice } from "@/lib/types";

const spring = { type: "spring" as const, stiffness: 260, damping: 24 };
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Counts up from 0 once mounted. */
function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const mv = useSpring(0, { stiffness: 45, damping: 16 });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => mv.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [mv, value, delay]);
  useMotionValueEvent(mv, "change", (v) => setDisplay(v));
  return <span className="tabular-nums">{money(display)}</span>;
}

function Paper({ inv, bank, onClose }: { inv: Invoice; bank: BankState; onClose: () => void }) {
  const client = bank.clients.find((c) => c.id === inv.clientId);
  const lines = inv.lineItems.length ? inv.lineItems : [{ description: inv.description || "Services", quantity: 1, unitPrice: inv.amount }];
  const wonky = invoiceDoesntAddUp(inv);
  const sent = inv.status === "sent";
  const rowsDone = 0.35 + lines.length * 0.09;

  return (
    <motion.div
      initial={{ y: 140, rotate: -5, scale: 0.9, opacity: 0 }}
      animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
      exit={{ y: 80, rotate: 4, scale: 0.92, opacity: 0, transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="relative w-[480px] max-w-[92vw] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-20px_rgba(90,50,70,0.45)]"
    >
      <div className="h-2.5 bg-gradient-to-r from-pink via-peach to-lavender" />

      <button
        onClick={onClose}
        aria-label="Close invoice"
        className="absolute top-5 right-4 flex h-8 w-8 items-center justify-center rounded-full text-lg font-black text-muted hover:bg-cream hover:text-ink"
      >
        ×
      </button>

      {/* stamp */}
      <motion.div
        initial={{ scale: 2.6, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 0.92, rotate: -14 }}
        transition={{ type: "spring", stiffness: 420, damping: 13, delay: rowsDone + 0.5 }}
        className={`pointer-events-none absolute top-24 right-8 rounded-xl border-[3px] px-3 py-1 text-xl font-black tracking-widest ${
          sent ? "border-mint-deep text-mint-deep" : "border-lavender-deep text-lavender-deep"
        }`}
      >
        {sent ? "SENT" : "DRAFT"}
      </motion.div>

      <div className="px-8 pt-6 pb-7">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <p className="text-[26px] leading-none font-black tracking-tight">Invoice</p>
          <p className="mt-1 text-sm font-extrabold text-muted">{inv.id}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.18 }}
          className="mt-5 grid grid-cols-2 gap-4 text-[13px]"
        >
          <div>
            <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">From</p>
            <p className="font-extrabold">{BUSINESS.name}</p>
            <p className="font-semibold text-muted">{BUSINESS.address}</p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">Bill to</p>
            <p className="font-extrabold">{client?.name ?? "Unknown client"}</p>
            <p className="font-semibold text-muted">{client?.address}</p>
            {client?.email ? (
              <p className="font-semibold text-muted">{client.email}</p>
            ) : (
              <p className="font-bold text-[#c4554b]">No email on file</p>
            )}
          </div>
          <div>
            <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">Issued</p>
            <p className="font-bold">{fmtDate(inv.issuedAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">Due</p>
            <p className="font-bold">{fmtDate(inv.dueAt)}</p>
          </div>
        </motion.div>

        {/* line items */}
        <div className="mt-6 rounded-2xl bg-cream px-4 py-3">
          <div className="grid grid-cols-[1fr_44px_80px_84px] gap-2 border-b border-line pb-2 text-[11px] font-extrabold tracking-wide text-muted uppercase">
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amount</span>
          </div>
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.35 + i * 0.09 }}
              className="grid grid-cols-[1fr_44px_80px_84px] gap-2 py-2 text-[13px] font-bold"
            >
              <span className="truncate">{l.description}</span>
              <span className="text-right tabular-nums">{l.quantity}</span>
              <span className="text-right tabular-nums">{money(l.unitPrice)}</span>
              <span className="text-right tabular-nums">{money(l.quantity * l.unitPrice)}</span>
            </motion.div>
          ))}
        </div>

        {/* total */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: rowsDone }}
          className="mt-4 flex items-end justify-between"
        >
          <div className="text-[12px] font-semibold text-muted">
            <p>
              Pay to {BUSINESS.sortCode} · {BUSINESS.account}
            </p>
            <p>Ref: {inv.id}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-extrabold tracking-wide text-muted uppercase">Total due</p>
            <motion.p
              animate={wonky ? { x: [0, -5, 5, -3, 3, 0] } : {}}
              transition={{ delay: rowsDone + 1.3, duration: 0.5 }}
              className={`text-[30px] leading-none font-black ${wonky ? "text-[#d0574c]" : "text-ink"}`}
            >
              <CountUp value={inv.amount} delay={rowsDone} />
            </motion.p>
          </div>
        </motion.div>

        <AnimatePresence>
          {wonky && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 16, delay: rowsDone + 1.2 }}
              className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-center text-[13px] font-extrabold text-[#c4554b]"
            >
              🤔 Hmm, the lines add up to {money(lineTotal(inv.lineItems))}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowsDone + 0.3 }}
          className="mt-5 text-center text-[13px] font-bold text-muted"
        >
          Thanks for your business! 💛
        </motion.p>
      </div>
    </motion.div>
  );
}

export function InvoiceModal({ invoiceId, bank, onClose }: { invoiceId: string | null; bank: BankState; onClose: () => void }) {
  const inv = invoiceId ? bank.invoices.find((i) => i.id === invoiceId) : undefined;

  useEffect(() => {
    if (!inv) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inv, onClose]);

  return (
    <AnimatePresence>
      {inv && (
        <motion.div
          key="invoice-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b2f3a]/25 backdrop-blur-[3px]"
        >
          <Paper key={inv.id} inv={inv} bank={bank} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
