"use client";

import { MotionConfig, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mascot } from "@/components/Mascot";

const up = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 160, damping: 20, delay },
});

const STEPS = [
  { icon: "💬", label: "Trick ANNA", tint: "bg-lavender/50" },
  { icon: "🐷", label: "Penny checks", tint: "bg-pink/40" },
  { icon: "🎯", label: "New test case", tint: "bg-mint/70" },
];

export default function Pitch() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto grid h-screen max-w-[1200px] grid-cols-[1fr_320px] items-center gap-12 px-16">
        <div className="flex flex-col gap-12">
          <motion.h1 {...up(0)} className="text-[72px] leading-none font-black tracking-tight">
            Trick <span className="rounded-2xl bg-pink/50 px-3">ANNA</span>
          </motion.h1>

          <div className="space-y-5">
            <motion.p {...up(0.3)} className="text-[34px] leading-tight font-extrabold">
              <span className="mr-3">😬</span>AI agents move real money.
              <span className="text-muted"> Testing them is slow.</span>
            </motion.p>
            <motion.p {...up(0.6)} className="text-[34px] leading-tight font-extrabold">
              <span className="mr-3">🎮</span>So we made finding their mistakes
              <span className="rounded-xl bg-mint/70 px-2">a game</span>.
            </motion.p>
          </div>

          <div className="flex items-center gap-4">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-4">
                <motion.div
                  {...up(0.9 + i * 0.2)}
                  className="flex items-center gap-3 rounded-full border border-line bg-white py-2 pr-6 pl-2 shadow-softer"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${s.tint}`}>{s.icon}</span>
                  <span className="text-xl font-black">{s.label}</span>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <motion.span {...up(1 + i * 0.2)} className="text-3xl font-black text-pink-deep">
                    →
                  </motion.span>
                )}
              </div>
            ))}
          </div>

          <motion.div {...up(1.6)}>
            <Link href="/" className="inline-block">
              <motion.span
                whileHover={{ scale: 1.05, x: 3 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-xl font-extrabold text-white shadow-soft"
              >
                Let&apos;s play
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  →
                </motion.span>
              </motion.span>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 110, damping: 11, delay: 0.5 }}
          className="flex justify-center"
        >
          <Mascot pose="idle" talking={false} />
        </motion.div>
      </main>
    </MotionConfig>
  );
}
