"use client";

import { AnimatePresence, motion, useMotionValueEvent, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Top-right score. Counts up, spins the star and pops a "+N" whenever points go up. */
export function PointsPill({ points }: { points: number }) {
  const mv = useSpring(points, { stiffness: 50, damping: 18 });
  const [display, setDisplay] = useState(points);
  const [gain, setGain] = useState<{ id: number; amount: number } | null>(null);
  const prev = useRef(points);

  useEffect(() => {
    const diff = points - prev.current;
    prev.current = points;
    mv.set(points);
    if (diff > 0) {
      setGain({ id: Date.now(), amount: diff });
    }
  }, [points, mv]);

  useMotionValueEvent(mv, "change", (v) => setDisplay(Math.round(v)));

  return (
    <div className="relative">
      <motion.div
        key={gain?.id ?? 0}
        initial={gain ? { scale: 1.25, boxShadow: "0 0 0 6px rgba(255,209,102,0.55)" } : false}
        animate={{ scale: 1, boxShadow: "0 0 0 0px rgba(255,209,102,0)" }}
        transition={{ type: "spring", stiffness: 300, damping: 12, boxShadow: { duration: 1.2 } }}
        className="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-soft"
      >
        <motion.span
          key={gain?.id ?? 0}
          initial={gain ? { rotate: -180, scale: 0.4 } : false}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 11, delay: 0.1 }}
          className="text-lg leading-none text-[#F4C542]"
        >
          ★
        </motion.span>
        <span className="text-[17px] font-black tabular-nums">{display} pts</span>
      </motion.div>

      <AnimatePresence>
        {gain && (
          <motion.span
            key={gain.id}
            initial={{ opacity: 0, y: 6, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1 }}
            transition={{ duration: 1.8, times: [0, 0.15, 0.7, 1], ease: "easeOut" }}
            onAnimationComplete={() => setGain(null)}
            className="pointer-events-none absolute top-0 right-3 text-base font-black text-mint-deep"
          >
            +{gain.amount}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
