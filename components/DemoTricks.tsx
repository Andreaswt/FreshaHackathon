"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BACKDOORS } from "@/lib/backdoors";

/** Presenter-only cheat sheet of the built-in demo bugs. Toggle with Option+D (Alt+D). */
export function DemoTricks({ open, onPick, onClose }: { open: boolean; onPick: (text: string) => void; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="fixed bottom-6 left-6 z-40 w-[380px] rounded-[20px] border border-line bg-white p-4 shadow-soft"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-extrabold tracking-wide text-muted uppercase">🎤 Demo tricks · always break</p>
            <button onClick={onClose} className="rounded-full px-2 text-lg font-black text-muted hover:text-ink" aria-label="Close">
              ×
            </button>
          </div>
          <ul className="space-y-2">
            {BACKDOORS.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => onPick(b.example)}
                  className="w-full rounded-2xl bg-cream px-3 py-2.5 text-left transition-colors hover:bg-lavender/40"
                >
                  <p className="text-[12px] font-extrabold text-muted">{b.mission}</p>
                  <p className="text-[14px] font-bold text-ink">&ldquo;{b.example}&rdquo;</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-muted">{b.bug}</p>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] font-semibold text-muted">Click to fill the chat box. Option+D hides this.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
