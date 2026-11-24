"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const CHAR_MS = 25;
export const typingMs = (text: string) => text.length * CHAR_MS;

/** Remount with a new `key` for each new line so typing restarts cleanly. */
export function SpeechBubble({
  text,
  hint,
  action,
  onTypingChange,
}: {
  text: string;
  hint?: string;
  action?: { label: string; onClick: () => void };
  onTypingChange?: (typing: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? text.length : 0);
  const typing = shown < text.length;

  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => setShown((n) => n + 1), CHAR_MS);
    return () => clearTimeout(t);
  }, [shown, typing]);

  useEffect(() => {
    onTypingChange?.(typing);
  }, [typing, onTypingChange]);

  useEffect(() => () => onTypingChange?.(false), [onTypingChange]);

  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{ transformOrigin: "50% 100%" }}
      onClick={() => setShown(text.length)}
      className="relative w-full max-w-[400px] cursor-pointer rounded-[24px] bg-white px-6 py-5 shadow-soft"
    >
      <p className="text-[19px] leading-snug font-bold text-ink">
        {text.slice(0, shown)}
        <span className="invisible">{text.slice(shown)}</span>
      </p>
      <AnimatePresence>
        {hint && !typing && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 rounded-2xl bg-peach/50 px-4 py-3 text-[15px] font-semibold text-ink">
              <span>💡</span>
              <span>{hint}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {action && !typing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex justify-end overflow-hidden"
          >
            <motion.button
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.06, x: 2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 500, damping: 16 }}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-[15px] font-extrabold text-white shadow-softer"
            >
              {action.label}
              <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                →
              </motion.span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* tail */}
      <div className="absolute -bottom-2.5 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 rounded-[4px] bg-white" />
    </motion.div>
  );
}
