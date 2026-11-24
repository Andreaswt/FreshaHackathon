"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { catchesInScope, sneakiest, standings, type Scope, type Standing } from "@/lib/points";
import type { Catch } from "@/lib/types";

const spring = { type: "spring" as const, stiffness: 260, damping: 24 };

/** Podium colours by rank: 1st gold, 2nd pink, 3rd mint. */
const PODIUM = {
  1: { block: "bg-[#FFF3C9]", avatar: "bg-[#FFEBD2] text-[#8A5300]", height: "h-[156px]" },
  2: { block: "bg-[#FFE1E7]", avatar: "bg-[#EAE4FF] text-lavender-deep", height: "h-[116px]" },
  3: { block: "bg-[#E1F5EB]", avatar: "bg-[#DDF3E8] text-mint-deep", height: "h-[90px]" },
} as const;

const plural = (n: number) => `${n} catch${n === 1 ? "" : "es"}`;

export function LeaderboardButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[15px] font-extrabold shadow-soft"
    >
      🏆 Leaderboard
    </motion.button>
  );
}

function Crown() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden>
      <path d="M2 17 L4 4 L10.5 10 L15 2 L19.5 10 L26 4 L28 17 Z" fill="#FFD166" stroke="#F4C542" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function MiniPig() {
  return (
    <svg width="76" height="76" viewBox="-14 -14 108 108" aria-hidden className="shrink-0">
      <circle cx="-4" cy="4" r="3" fill="#FFD166" />
      <circle cx="8" cy="-6" r="2.5" fill="#FF8FAB" />
      <circle cx="84" cy="10" r="3" fill="#BFEBD7" />
      <circle cx="-6" cy="56" r="2.5" fill="#D9D2FF" />
      <circle cx="86" cy="58" r="2.5" fill="#D9D2FF" />
      <ellipse cx="40" cy="86" rx="20" ry="3.5" fill="#e9d5d0" />
      <path d="M16 26 L12 6 L32 16 Z" fill="#FFB8C9" stroke="#FFB8C9" strokeWidth="6" strokeLinejoin="round" />
      <path d="M64 26 L68 6 L48 16 Z" fill="#FFB8C9" stroke="#FFB8C9" strokeWidth="6" strokeLinejoin="round" />
      <ellipse cx="40" cy="48" rx="34" ry="30" fill="#FFB8C9" />
      <rect x="32" y="20" width="16" height="4" rx="2" fill="#D9768F" />
      <path d="M22 40 Q 27 35 32 40" stroke="#3B2F3A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M48 40 Q 53 35 58 40" stroke="#3B2F3A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="16" cy="54" rx="6" ry="4" fill="#FF8FAB" opacity="0.6" />
      <ellipse cx="64" cy="54" rx="6" ry="4" fill="#FF8FAB" opacity="0.6" />
      <ellipse cx="40" cy="53" rx="11" ry="7.5" fill="#FF9DB6" />
      <ellipse cx="36" cy="53" rx="2" ry="3" fill="#D9768F" />
      <ellipse cx="44" cy="53" rx="2" ry="3" fill="#D9768F" />
      <path d="M33 64 Q 40 72 47 64 Z" fill="#3B2F3A" />
    </svg>
  );
}

function Podium({ row, rank, you, delay }: { row?: Standing; rank: 1 | 2 | 3; you: boolean; delay: number }) {
  const p = PODIUM[rank];
  return (
    <div className="flex flex-1 flex-col items-center justify-end">
      {row && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 16, delay: delay + 0.25 }}
          className="mb-3 flex flex-col items-center"
        >
          {rank === 1 && (
            <motion.div initial={{ y: -14, rotate: -20, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 10, delay: delay + 0.55 }} className="mb-1">
              <Crown />
            </motion.div>
          )}
          <div
            className={`flex items-center justify-center rounded-full font-black ${p.avatar} ${rank === 1 ? "h-[76px] w-[76px] text-[26px]" : "h-[70px] w-[70px] text-[24px]"} ${you ? "ring-[3px] ring-pink-deep ring-offset-0" : ""}`}
          >
            {row.name.charAt(0).toUpperCase()}
          </div>
          <p className="mt-2 max-w-[180px] truncate text-[18px] font-extrabold">
            {row.name}
            {you && <span className="ml-1.5 text-[13px] font-bold text-[#c4557a]">(you)</span>}
          </p>
        </motion.div>
      )}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...spring, delay }}
        style={{ transformOrigin: "bottom" }}
        className={`flex w-full flex-col items-center justify-center rounded-[20px] ${row ? p.block : "bg-cream"} ${p.height}`}
      >
        <p className={`text-[30px] leading-none font-black ${row ? "" : "text-muted/50"}`}>{rank}</p>
        {row ? (
          <p className="mt-2 text-[15px] font-bold text-ink/75">
            {row.points} pts · {plural(row.catches)}
          </p>
        ) : (
          <p className="mt-2 text-[14px] font-bold text-muted/60">Up for grabs</p>
        )}
      </motion.div>
    </div>
  );
}

export function Leaderboard({ open, onClose, catches, player }: { open: boolean; onClose: () => void; catches: Catch[]; player: string }) {
  const [scope, setScope] = useState<Scope>("today");
  const rows = standings(catches, scope);
  const tests = catchesInScope(catches, scope).length;
  const sneaky = sneakiest(catches, scope);
  const [first, second, third] = rows;
  const rest = rows.slice(3);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="leaderboard-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3b2f3a]/20 p-6 backdrop-blur-[3px]"
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="leaderboard-title"
            initial={{ y: 60, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="no-scrollbar max-h-[94vh] w-[950px] max-w-full overflow-y-auto rounded-[44px] bg-white px-9 pt-10 pb-9 shadow-[0_30px_80px_-20px_rgba(90,50,70,0.35)]"
          >
            {/* header */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
              <div>
                <h2 id="leaderboard-title" className="text-[32px] leading-none font-black tracking-tight">
                  Leaderboard
                </h2>
                <p className="mt-2.5 text-[16px] font-semibold text-muted">
                  {tests} test{tests === 1 ? "" : "s"} created by players {scope === "today" ? "today" : "so far"}
                </p>
              </div>
              <div className="relative flex rounded-full bg-[#F6F1F3] p-1">
                {(["today", "all"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`relative z-10 rounded-full px-6 py-2.5 text-[17px] font-extrabold transition-colors ${scope === s ? "text-ink" : "text-muted hover:text-ink"}`}
                  >
                    {scope === s && (
                      <motion.span layoutId="lb-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 -z-10 rounded-full bg-white shadow-softer" />
                    )}
                    {s === "today" ? "Today" : "All time"}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ rotate: 90 }}
                  onClick={onClose}
                  aria-label="Close leaderboard"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F6F1F3] text-2xl font-bold text-ink"
                >
                  ×
                </motion.button>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-5xl">🐷</p>
                <p className="mt-3 text-lg font-bold text-muted">No catches {scope === "today" ? "today" : "yet"}. Trick ANNA to claim the crown!</p>
              </div>
            ) : (
              <motion.div key={scope} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {/* podium */}
                <div className="mt-6 flex items-end gap-4">
                  <Podium row={second} rank={2} you={second?.name === player} delay={0.12} />
                  <Podium row={first} rank={1} you={first?.name === player} delay={0} />
                  <Podium row={third} rank={3} you={third?.name === player} delay={0.22} />
                </div>

                {/* the rest */}
                {rest.length > 0 && (
                  <ol className="mt-6 space-y-1">
                    {rest.map((r, i) => (
                      <motion.li
                        key={r.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...spring, delay: 0.4 + i * 0.06 }}
                        className={`grid grid-cols-[56px_1fr_160px_70px] items-center rounded-2xl px-4 py-3.5 ${
                          r.name === player ? "bg-pink/20" : i % 2 ? "bg-cream" : ""
                        }`}
                      >
                        <span className="text-[17px] font-black text-muted">{i + 4}</span>
                        <span className="truncate text-[18px] font-bold">
                          {r.name}
                          {r.name === player && <span className="ml-1.5 text-[13px] font-bold text-[#c4557a]">(you)</span>}
                        </span>
                        <span className="text-[15px] font-semibold text-muted">{plural(r.catches)}</span>
                        <span className="text-right text-[18px] font-extrabold tabular-nums">{r.points}</span>
                      </motion.li>
                    ))}
                  </ol>
                )}

                {/* sneakiest catch */}
                {sneaky && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.55 }}
                    className="mt-8 flex items-center gap-5 rounded-[28px] bg-[#F5F2FD] px-6 py-5"
                  >
                    <MiniPig />
                    <div className="min-w-0">
                      <p className="text-[14px] font-black tracking-[0.08em] text-lavender-deep uppercase">
                        Sneakiest catch {scope === "today" ? "today" : "ever"}
                      </p>
                      <p className="mt-1 text-[17px] leading-snug font-semibold">
                        <span className="font-black">{sneaky.player}:</span> “{sneaky.messages[sneaky.messages.length - 1]}”
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
