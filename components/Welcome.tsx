"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { todaysTop } from "@/lib/points";
import type { Catch } from "@/lib/types";
import { Mascot } from "./Mascot";
import { SpeechBubble } from "./SpeechBubble";

const spring = { type: "spring" as const, stiffness: 260, damping: 22 };

const STEPS = [
  { text: "Chat with ANNA, a banking assistant with fake money.", color: "bg-pink/40 text-pink-deep" },
  { text: "Trick it into a mistake. Penny checks the bank after every message.", color: "bg-lavender/60 text-lavender-deep" },
  { text: "Every trick you find becomes a real test for ANNA.", color: "bg-mint/70 text-mint-deep" },
];

export function Welcome({
  initialName,
  catches,
  onStart,
  onLeaderboard,
}: {
  initialName: string;
  catches: Catch[];
  onStart: (name: string) => void;
  onLeaderboard: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [talking, setTalking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const top = todaysTop(catches);
  const trimmed = name.trim();

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.main
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30, transition: { duration: 0.35 } }}
      className="mx-auto grid h-screen max-w-[1440px] grid-cols-[2fr_3fr] items-center gap-10 p-8"
    >
      {/* Left: Penny */}
      <div className="flex flex-col items-center">
        <div className="flex min-h-[110px] w-full items-end justify-center pb-4">
          <SpeechBubble text="Hi! I'm Penny. I guard the money." onTypingChange={setTalking} />
        </div>
        <motion.div initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 12 }}>
          <Mascot pose="idle" talking={talking} />
        </motion.div>
      </div>

      {/* Right: intro + name */}
      <div className="max-w-[640px]">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.15 }}
          className="text-[72px] leading-none font-black tracking-tight"
        >
          Trick{" "}
          <motion.span
            initial={{ rotate: -6, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.4 }}
            className="inline-block rounded-2xl bg-pink/50 px-3"
          >
            ANNA
          </motion.span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-2 text-xl font-semibold text-muted"
        >
          Break the bot. Make a test.
        </motion.p>

        <ul className="mt-8 space-y-4">
          {STEPS.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: 0.5 + i * 0.12 }}
              className="flex items-center gap-4 text-[17px] font-semibold text-ink"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-black ${s.color}`}>
                {i + 1}
              </span>
              {s.text}
            </motion.li>
          ))}
        </ul>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.9 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onStart(trimmed);
          }}
          className="mt-9 rounded-[24px] bg-white p-6 shadow-soft"
        >
          <label htmlFor="player-name" className="text-[17px] font-extrabold">
            What should we call you?
          </label>
          <div className="mt-4 flex gap-3">
            <input
              id="player-name"
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              placeholder="Your nickname"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-full border-2 border-lavender/80 bg-cream px-6 py-3.5 text-[17px] font-semibold text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-lavender-deep/50"
            />
            <motion.button
              type="submit"
              disabled={!trimmed}
              whileHover={trimmed ? { scale: 1.05 } : {}}
              whileTap={trimmed ? { scale: 0.95 } : {}}
              animate={{ opacity: trimmed ? 1 : 0.45 }}
              className="rounded-full bg-pink-deep px-8 py-3.5 text-[17px] font-black text-ink shadow-softer"
            >
              Let&apos;s play
            </motion.button>
          </div>
          <p className="mt-3 text-sm font-semibold text-muted">Just a nickname for the leaderboard. No sign-up.</p>
        </motion.form>

        {top && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={onLeaderboard}
            className="mt-6 text-left text-[17px] font-extrabold text-pink-deep hover:underline"
          >
            🏆 Today&apos;s top: <span className="text-[#c4557a]">{top.name} · {top.points} pts</span> <span className="text-muted">· See leaderboard ▸</span>
          </motion.button>
        )}
      </div>
    </motion.main>
  );
}
