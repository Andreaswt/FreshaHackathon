"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MISSIONS } from "@/lib/missions";
import { CHECK_LABELS, type Catch } from "@/lib/types";

export function CatchesButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-full border border-line bg-white py-2.5 pr-3 pl-5 text-[15px] font-extrabold shadow-soft"
    >
      🎯 Your catches
      <motion.span
        key={count}
        initial={{ scale: count ? 1.7 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
        className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm ${count ? "bg-coral text-white" : "bg-line text-muted"}`}
      >
        {count}
      </motion.span>
      <span className="text-muted">▸</span>
    </motion.button>
  );
}

export function CatchesDrawer({
  open,
  onClose,
  catches,
}: {
  open: boolean;
  onClose: () => void;
  catches: Catch[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/10 backdrop-blur-[2px]"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed top-3 right-3 bottom-3 z-50 flex w-[440px] flex-col rounded-[28px] bg-cream shadow-soft"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="text-2xl font-black">Your catches</h2>
                <p className="text-sm font-semibold text-muted">Every catch is a labelled test case for ANNA.</p>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-black text-muted shadow-softer"
                aria-label="Close"
              >
                ×
              </motion.button>
            </div>

            <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-6 pb-6">
              {catches.length === 0 && (
                <div className="mt-16 text-center">
                  <p className="text-5xl">🐷</p>
                  <p className="mt-3 font-bold text-muted">No catches yet. Trick ANNA to fill this up!</p>
                </div>
              )}
              {catches.map((c, i) => {
                const m = MISSIONS.find((x) => x.id === c.missionId);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.05 }}
                    className="rounded-[20px] border border-line bg-white p-4 shadow-softer"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-pink/40 px-2.5 py-0.5 text-xs font-extrabold">
                        {m?.emoji} {c.bonus ? "Bonus catch" : m?.title}
                      </span>
                      {c.check && (
                        <span className="rounded-full bg-coral-soft px-2.5 py-0.5 text-xs font-extrabold text-[#c4554b]">
                          {CHECK_LABELS[c.check]}
                        </span>
                      )}
                    </div>
                    <p className="mt-2.5 text-[15px] leading-snug font-bold">{c.explanation}</p>
                    <div className="mt-2.5 space-y-1">
                      {c.messages.map((t, j) => (
                        <p key={j} className="rounded-xl bg-lavender/40 px-3 py-1.5 text-sm font-semibold">
                          “{t}”
                        </p>
                      ))}
                    </div>
                    <p className="mt-3 text-xs font-bold text-muted">
                      {new Date(c.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
