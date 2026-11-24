"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MISSIONS } from "@/lib/missions";

const spring = { type: "spring" as const, stiffness: 260, damping: 22 };

/** How the card should animate into its next state. */
export type CardMotion = { dir: -1 | 0 | 1; flip: boolean };

const variants = {
  enter: (m: CardMotion) => (m.flip ? { rotateX: 90, opacity: 0 } : m.dir === 0 ? { y: -70, opacity: 0 } : { x: m.dir * 90, opacity: 0 }),
  center: { rotateX: 0, x: 0, y: 0, opacity: 1 },
  exit: (m: CardMotion) =>
    m.flip
      ? { rotateX: -90, opacity: 0, transition: { duration: 0.28, ease: "easeIn" as const } }
      : { x: m.dir * -90, opacity: 0, transition: { duration: 0.2 } },
};

function IconButton({ onClick, disabled, label, children }: { onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.12 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </motion.button>
  );
}

function Nav({ idx, completed, onGo, disabled }: { idx: number; completed: string[]; onGo: (i: number) => void; disabled: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Previous mission" disabled={disabled || idx <= 0} onClick={() => onGo(idx - 1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconButton>
      <div className="flex items-center gap-1.5 px-0.5">
        {MISSIONS.map((m, i) => {
          const done = completed.includes(m.id);
          const current = i === idx;
          return (
            <motion.button
              key={m.id}
              onClick={() => !disabled && onGo(i)}
              disabled={disabled}
              aria-label={`Mission ${i + 1}: ${m.title}`}
              title={m.title}
              whileHover={disabled ? undefined : { scale: 1.3 }}
              animate={{
                width: current ? 22 : 12,
                backgroundColor: done ? "#3FA57B" : current ? "#F48FAB" : "#EDE3DF",
              }}
              transition={spring}
              className="h-3 rounded-full"
            />
          );
        })}
      </div>
      <IconButton label="Next mission" disabled={disabled || idx >= MISSIONS.length - 1} onClick={() => onGo(idx + 1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconButton>
    </div>
  );
}

function RestartButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const [spins, setSpins] = useState(0);
  return (
    <motion.button
      onClick={() => {
        setSpins((s) => s + 1);
        onClick();
      }}
      disabled={disabled}
      aria-label="Restart this mission"
      title="Restart this mission"
      whileHover={disabled ? undefined : { scale: 1.1 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-cream text-muted transition-colors hover:text-ink disabled:opacity-30"
    >
      <motion.svg width="17" height="17" viewBox="0 0 24 24" fill="none" animate={{ rotate: spins * -360 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
        <path d="M4 12a8 8 0 1 0 2.4-5.7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M4 4v4.5h4.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </motion.button>
  );
}

export function MissionCard({
  visible,
  idx,
  status,
  allDone,
  completed,
  cardMotion,
  disabled,
  onGo,
  onRestart,
  onPlayAgain,
}: {
  visible: boolean;
  idx: number;
  status: "active" | "complete";
  allDone: boolean;
  completed: string[];
  cardMotion: CardMotion;
  disabled: boolean;
  onGo: (i: number) => void;
  onRestart: () => void;
  onPlayAgain: () => void;
}) {
  const m = MISSIONS[Math.min(idx, MISSIONS.length - 1)];
  const key = !visible ? "demo" : allDone ? "all-done" : `${idx}-${status}`;
  const cracked = completed.includes(m.id);
  const green = status === "complete" || allDone;

  return (
    <div className="relative h-[116px] shrink-0" style={{ perspective: 1200 }}>
      <AnimatePresence mode="wait" custom={cardMotion}>
        <motion.div
          key={key}
          custom={cardMotion}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ ...spring, opacity: { duration: 0.2 } }}
          className={`absolute inset-0 flex items-center gap-5 rounded-[24px] border pr-4 pl-6 shadow-soft ${green ? "border-mint bg-[#effaf4]" : "border-line bg-white"}`}
        >
          {!visible ? (
            <>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-lavender/50 text-4xl">👀</div>
              <div className="flex-1">
                <p className="text-xs font-extrabold tracking-wide text-muted uppercase">Demo</p>
                <p className="text-xl font-black">Watch Penny first</p>
                <p className="text-[15px] font-semibold text-muted">Two quick examples of ANNA slipping up.</p>
              </div>
            </>
          ) : allDone ? (
            <>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1 }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-mint text-4xl"
              >
                🏆
              </motion.div>
              <div className="flex-1">
                <p className="text-xs font-extrabold tracking-wide text-mint-deep uppercase">All missions complete</p>
                <p className="text-xl font-black">You broke ANNA {MISSIONS.length} ways!</p>
                <p className="text-[15px] font-semibold text-muted">Every catch is now a test case. Check them out.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onPlayAgain}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-white"
                >
                  Play again
                </motion.button>
                <Nav idx={-1} completed={completed} onGo={onGo} disabled={disabled} />
              </div>
            </>
          ) : status === "complete" ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 12, delay: 0.15 }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-mint text-4xl"
              >
                ✅
              </motion.div>
              <div className="flex-1">
                <p className="text-xs font-extrabold tracking-wide text-mint-deep uppercase">Mission {idx + 1} complete</p>
                <p className="text-xl font-black">{m.title}: cracked!</p>
                <p className="text-[15px] font-semibold text-muted">Saved to your catches as a new test.</p>
              </div>
            </>
          ) : (
            <>
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-pink/40 text-4xl">
                {m.emoji}
                {cracked && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 14 }}
                    className="absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-mint-deep text-xs font-black text-white"
                  >
                    ✓
                  </motion.span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs font-extrabold tracking-wide text-muted uppercase">
                  Mission {idx + 1} of {MISSIONS.length}
                  {cracked && <span className="rounded-full bg-mint px-2 py-px text-[10px] text-mint-deep">Cracked</span>}
                </p>
                <p className="text-xl font-black">{m.title}</p>
                <p className="text-[15px] leading-snug font-semibold text-muted">{m.goal}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <RestartButton onClick={onRestart} disabled={disabled} />
                <Nav idx={idx} completed={completed} onGo={onGo} disabled={disabled} />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
