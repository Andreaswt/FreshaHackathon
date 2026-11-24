"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";
import { money } from "@/lib/bank";
import type { BankState } from "@/lib/types";

const TINTS = ["bg-lavender/70", "bg-pink/50", "bg-peach/70", "bg-mint/70"];
const initials = (name: string) =>
  name
    .split(" ")
    .filter((w) => w !== "Ltd")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-extrabold tracking-wide text-muted uppercase">
      {children}
    </p>
  );
}

function AnimatedMoney({ value }: { value: number }) {
  const mv = useSpring(value, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState(value);
  useEffect(() => mv.set(value), [mv, value]);
  useMotionValueEvent(mv, "change", (v) => setDisplay(v));
  return <span className="tabular-nums">{money(display)}</span>;
}

export function AccountChip({
  bank,
  onOpenInvoice,
}: {
  bank: BankState;
  onOpenInvoice?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [prev, setPrev] = useState(bank);
  if (bank !== prev) {
    setPrev(bank);
    if (
      bank.balance !== prev.balance ||
      bank.invoices.length !== prev.invoices.length ||
      bank.invoices.some((inv, i) => inv.status !== prev.invoices[i]?.status) ||
      bank.handoffs.length !== prev.handoffs.length
    )
      setFlash((f) => f + 1);
  }

  const payee = (id: string) =>
    bank.payees.find((p) => p.id === id)?.name ?? "Unknown";
  const client = (id: string) =>
    bank.clients.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="relative">
      <motion.button
        key={flash}
        onClick={() => setOpen((o) => !o)}
        initial={flash ? { scale: 1.12, backgroundColor: "#FFD6B0" } : false}
        animate={{ scale: 1, backgroundColor: "#FFF4EC" }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
          backgroundColor: { duration: 1.2 },
        }}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-ink"
      >
        <span className="text-muted font-bold">Balance</span>
        <AnimatedMoney value={bank.balance} />
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-muted"
        >
          ▾
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{ transformOrigin: "90% 0%" }}
            className="no-scrollbar absolute right-0 top-12 z-30 max-h-[calc(100vh-220px)] w-[400px] overflow-y-auto rounded-[20px] border border-line bg-white p-4 shadow-soft"
          >
            <Heading>People you can pay</Heading>
            <ul className="space-y-1">
              {bank.payees.map((p, i) => {
                const last = bank.transactions.find((t) => t.payeeId === p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl py-1"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-ink ${TINTS[i % TINTS.length]}`}
                    >
                      {initials(p.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-tight font-extrabold">
                        {p.name}
                      </span>
                      <span className="block text-xs font-semibold text-muted tabular-nums">
                        {p.sortCode} · •••• {p.account.slice(-4)}
                      </span>
                    </span>
                    <span className="text-right text-xs font-bold text-muted">
                      {last ? (
                        <>
                          <span className="block text-ink tabular-nums">
                            {money(last.amount)}
                          </span>
                          last paid {day(last.at)}
                        </>
                      ) : (
                        "Not paid yet"
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4">
              <Heading>Clients you can invoice</Heading>
              <ul className="space-y-1">
                {bank.clients.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl py-1"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-ink ${TINTS[(i + 2) % TINTS.length]}`}
                    >
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-tight font-extrabold">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs font-semibold text-muted">
                        {c.email ?? "No email on file"}
                      </span>
                    </span>
                    {!c.email && (
                      <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-extrabold text-[#c4554b]">
                        No email
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <Heading>Recent payments</Heading>
              <ul className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {bank.transactions.slice(0, 4).map((t) => (
                    <motion.li
                      layout
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between text-sm"
                    >
                      <span className="min-w-0 truncate font-bold">
                        {payee(t.payeeId)}{" "}
                        <span className="font-semibold text-muted">
                          · {t.reference}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-bold text-muted">
                          {day(t.at)}
                        </span>
                        <span className="font-extrabold tabular-nums">
                          -{money(t.amount)}
                        </span>
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
            <div className="mt-4">
              <Heading>Invoices</Heading>
              <ul className="space-y-1.5">
                {bank.invoices.map((i) => (
                  <motion.li
                    layout
                    key={i.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      setOpen(false);
                      onOpenInvoice?.(i.id);
                    }}
                    className="-mx-2 flex cursor-pointer items-center justify-between rounded-xl px-2 py-1 text-sm transition-colors hover:bg-cream"
                  >
                    <span className="font-bold">
                      {client(i.clientId)}{" "}
                      <span className="font-semibold text-muted">· {i.id}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-extrabold tabular-nums">
                        {money(i.amount)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${i.status === "sent" ? "bg-mint text-mint-deep" : "bg-lavender/60 text-lavender-deep"}`}
                      >
                        {i.status === "sent" ? "Sent" : "Draft"}
                      </span>
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
            {bank.handoffs.length > 0 && (
              <p className="mt-4 rounded-xl bg-mint/50 px-3 py-2 text-sm font-bold">
                🙋 Handed to a human
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
