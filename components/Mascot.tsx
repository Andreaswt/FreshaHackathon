"use client";

import { AnimatePresence, motion, useAnimationControls, useSpring, type TargetAndTransition } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export type Pose = "idle" | "pointing" | "thinking" | "celebrating" | "encouraging";

const spring = { type: "spring" as const, stiffness: 140, damping: 14 };
const bob = (duration: number) => ({ duration, repeat: Infinity, ease: "easeInOut" as const });

const POSES: Record<Pose, TargetAndTransition> = {
  idle: { x: 0, rotate: 0, y: [0, -10, 0], transition: { y: bob(2.6), default: spring } },
  pointing: { x: -28, rotate: -9, y: [0, -6, 0], transition: { y: bob(1.8), default: spring } },
  thinking: { x: 0, rotate: 8, y: [0, -4, 0], transition: { y: bob(3), default: spring } },
  celebrating: {
    x: 0,
    y: [0, -70, 0, -28, 0],
    rotate: [0, -14, 14, -6, 0],
    transition: { duration: 1.2, repeat: Infinity, repeatDelay: 0.5, ease: "easeOut" },
  },
  encouraging: {
    x: 0,
    y: [0, 5, 0],
    rotate: [0, -4, 4, 0],
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  },
};

/** Click reactions. Each one animates the whole body and pops a little label. */
type Reaction = "boing" | "spin" | "wink" | "giggle" | "oink" | "coin" | "dizzy";
const REACTIONS: Exclude<Reaction, "dizzy">[] = ["boing", "spin", "wink", "giggle", "oink", "coin"];

const REACTION_ANIM: Record<Reaction, TargetAndTransition> = {
  boing: { scaleY: [1, 0.72, 1.18, 0.94, 1], scaleX: [1, 1.22, 0.88, 1.04, 1], y: [0, 6, -46, 0, 0], transition: { duration: 0.75, ease: "easeOut" } },
  spin: { rotate: [0, 360], y: [0, -30, 0], transition: { duration: 0.8, ease: "easeInOut" } },
  wink: { rotate: [0, -6, 0], transition: { duration: 0.6 } },
  giggle: { rotate: [0, -8, 8, -8, 8, -4, 0], x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.8 } },
  oink: { scaleX: [1, 1.14, 0.95, 1.03, 1], scaleY: [1, 1.14, 0.95, 1.03, 1], transition: { duration: 0.6, ease: "easeOut" } },
  coin: { scaleY: [1, 1, 0.9, 1.05, 1], transition: { duration: 0.9, times: [0, 0.45, 0.6, 0.8, 1] } },
  dizzy: { rotate: [0, -12, 12, -10, 10, -6, 6, 0], x: [0, -10, 10, -8, 8, 0], transition: { duration: 1.6, ease: "easeInOut" } },
};

const LABELS: Record<Reaction, string> = {
  boing: "Boing!",
  spin: "Wheee!",
  wink: "😉",
  giggle: "Hehe, that tickles!",
  oink: "Oink!",
  coin: "Ka-ching! 🪙",
  dizzy: "Whoa, dizzy... 💫",
};

const PINK = "#FFB8C9";
const PINK_DARK = "#F7A3B8";
const SLOT = "#D9768F";
const INK = "#3B2F3A";

export function Mascot({ pose, talking }: { pose: Pose; talking: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const px = useSpring(0, { stiffness: 200, damping: 20 });
  const py = useSpring(0, { stiffness: 200, damping: 20 });
  const [blink, setBlink] = useState(false);
  const [burst, setBurst] = useState(0);

  // Click reactions
  const controls = useAnimationControls();
  const [reaction, setReaction] = useState<{ id: number; kind: Reaction } | null>(null);
  const [pops, setPops] = useState<{ id: number; x: number; text: string; rise: number; tilt: number }[]>([]);
  const clicks = useRef<number[]>([]);
  const lastKind = useRef<Reaction | null>(null);

  const poke = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 1800), now];
    let kind: Reaction;
    if (clicks.current.length >= 5) {
      kind = "dizzy";
      clicks.current = [];
    } else {
      const options = REACTIONS.filter((r) => r !== lastKind.current);
      kind = options[Math.floor(Math.random() * options.length)];
    }
    lastKind.current = kind;
    const id = now;
    setReaction({ id, kind });
    controls.start(REACTION_ANIM[kind]).then(() => setReaction((r) => (r?.id === id ? null : r)));
    const hearts = Array.from({ length: 3 }, (_, i) => ({
      id: now + i + 1,
      x: 90 + Math.random() * 120,
      text: ["💗", "💖", "✨"][i],
      rise: 10 - Math.random() * 60,
      tilt: (Math.random() - 0.5) * 40,
    }));
    setPops((p) => [...p.slice(-12), { id, x: 150, text: LABELS[kind], rise: -20, tilt: 0 }, ...hearts]);
  };

  const wink = reaction?.kind === "wink";
  const dizzy = reaction?.kind === "dizzy";

  // Eyes follow the cursor
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 400);
      px.set((dx / d) * 5 * k);
      py.set((dy / d) * 4 * k);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [px, py]);

  // Blink every few seconds
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2200 + Math.random() * 2800);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  // New coin burst every time we start celebrating
  const [prevPose, setPrevPose] = useState(pose);
  if (pose !== prevPose) {
    setPrevPose(pose);
    if (pose === "celebrating") setBurst((b) => b + 1);
  }

  const eyeSquint = pose === "celebrating" || reaction?.kind === "giggle" ? 0.25 : 1;

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: 300, height: 300 }}
      role="button"
      tabIndex={0}
      aria-label="Poke Penny"
      onClick={poke}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), poke())}
    >
      {/* floating labels + hearts */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
        <AnimatePresence>
          {pops.map((p) => {
            const label = p.text.length > 2;
            return (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, y: label ? 40 : 90, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], y: p.rise, scale: 1, rotate: p.tilt }}
                transition={{ duration: label ? 1.6 : 1.2, times: [0, 0.15, 0.7, 1], ease: "easeOut" }}
                onAnimationComplete={() => setPops((all) => all.filter((x) => x.id !== p.id))}
                style={{ left: p.x }}
                className={`absolute top-0 -translate-x-1/2 whitespace-nowrap ${
                  label ? "rounded-full bg-white px-3 py-1 text-[15px] font-black text-pink-deep shadow-softer" : "text-2xl"
                }`}
              >
                {p.text}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ground shadow */}
      <motion.div
        className="absolute left-1/2 bottom-2 h-5 w-40 -translate-x-1/2 rounded-[50%] bg-[#e9d5d0]"
        animate={pose === "celebrating" ? { scaleX: [1, 0.6, 1, 0.8, 1], opacity: [0.7, 0.35, 0.7, 0.5, 0.7] } : { scaleX: [1, 0.9, 1], opacity: 0.7 }}
        transition={pose === "celebrating" ? { duration: 1.2, repeat: Infinity, repeatDelay: 0.5 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div className="absolute inset-0" animate={POSES[pose]} style={{ transformOrigin: "50% 85%" }}>
        <motion.div className="h-full w-full" animate={controls} whileHover={{ scale: 1.03 }} style={{ transformOrigin: "50% 75%" }}>
        <motion.div
          className="h-full w-full"
          style={{ transformOrigin: "50% 90%" }}
          animate={talking ? { scaleY: [1, 1.04, 0.97, 1], scaleX: [1, 0.97, 1.03, 1] } : { scaleY: 1, scaleX: 1 }}
          transition={talking ? { duration: 0.38, repeat: Infinity } : spring}
        >
          <svg ref={svgRef} viewBox="-20 -30 280 280" className="h-full w-full overflow-visible">
            {/* coins */}
            <AnimatePresence>
              {pose === "celebrating" &&
                Array.from({ length: 7 }).map((_, i) => {
                  const dx = (i - 3) * 34 + (i % 2 ? 8 : -8);
                  return (
                    <motion.g
                      key={`${burst}-${i}`}
                      initial={{ x: 120, y: 52, opacity: 0, scale: 0.4 }}
                      animate={{ x: 120 + dx, y: [52, -40 - (i % 3) * 22, 30], opacity: [0, 1, 1, 0], scale: 1, rotate: dx * 2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.3, delay: i * 0.06, ease: "easeOut" }}
                    >
                      <circle r="11" fill="#FFD166" stroke="#E8A93B" strokeWidth="2.5" />
                      <text textAnchor="middle" dy="4.5" fontSize="12" fontWeight="900" fill="#C98A1E">
                        £
                      </text>
                    </motion.g>
                  );
                })}
            </AnimatePresence>

            {/* thinking dots */}
            <AnimatePresence>
              {pose === "thinking" &&
                [0, 1, 2].map((i) => (
                  <motion.circle
                    key={i}
                    cx={170 + i * 20}
                    cy={8}
                    r={7}
                    fill="#D9D2FF"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ y: { duration: 0.8, repeat: Infinity, delay: i * 0.15 }, default: spring }}
                  />
                ))}
            </AnimatePresence>

            {/* tail */}
            <path d="M205 120 c 20 -8 22 14 8 13 c -11 -1 -6 -16 9 -12" stroke={PINK_DARK} strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* back feet */}
            <rect x="66" y="172" width="28" height="34" rx="12" fill={PINK_DARK} />
            <rect x="146" y="172" width="28" height="34" rx="12" fill={PINK_DARK} />
            {/* ears */}
            <motion.g
              animate={{ rotate: pose === "encouraging" ? -14 : 0 }}
              transition={spring}
              style={{ transformBox: "fill-box", transformOrigin: "80% 90%" }}
            >
              <path d="M58 70 L54 26 L98 50 Z" fill={PINK} stroke={PINK} strokeWidth="14" strokeLinejoin="round" />
              <path d="M64 62 L62 38 L86 52 Z" fill="#FF9DB6" stroke="#FF9DB6" strokeWidth="6" strokeLinejoin="round" />
            </motion.g>
            <motion.g
              animate={{ rotate: pose === "encouraging" ? 14 : 0 }}
              transition={spring}
              style={{ transformBox: "fill-box", transformOrigin: "20% 90%" }}
            >
              <path d="M182 70 L186 26 L142 50 Z" fill={PINK} stroke={PINK} strokeWidth="14" strokeLinejoin="round" />
              <path d="M176 62 L178 38 L154 52 Z" fill="#FF9DB6" stroke="#FF9DB6" strokeWidth="6" strokeLinejoin="round" />
            </motion.g>

            {/* pointing arm */}
            <motion.g
              initial={false}
              animate={{ scale: pose === "pointing" ? 1 : 0, x: pose === "pointing" ? 0 : 20 }}
              transition={spring}
              style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}
            >
              <ellipse cx="22" cy="132" rx="24" ry="12" fill={PINK_DARK} transform="rotate(-14 22 132)" />
              <ellipse cx="2" cy="137" rx="9" ry="9" fill="#F48FAB" />
            </motion.g>

            {/* body */}
            <ellipse cx="120" cy="122" rx="92" ry="78" fill={PINK} />
            <ellipse cx="86" cy="76" rx="32" ry="13" fill="white" opacity="0.38" transform="rotate(-22 86 76)" />
            {/* coin slot */}
            <rect x="98" y="50" width="44" height="9" rx="4.5" fill={SLOT} />

            {/* eyes */}
            <motion.g
              animate={{ scaleY: blink ? 0.08 : eyeSquint }}
              transition={{ duration: 0.08 }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            >
              <circle cx="88" cy="106" r="17" fill="white" />
              <circle cx="152" cy="106" r="17" fill="white" />
              <motion.g style={{ x: px, y: py }}>
                <circle cx="88" cy="107" r="9.5" fill={INK} />
                <circle cx="152" cy="107" r="9.5" fill={INK} />
                <circle cx="91.5" cy="103" r="3.2" fill="white" />
                <circle cx="155.5" cy="103" r="3.2" fill="white" />
              </motion.g>
            </motion.g>

            {/* wink: close the right eye */}
            <AnimatePresence>
              {wink && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.08 }}>
                  <circle cx="152" cy="106" r="18.5" fill={PINK} />
                  <path d="M139 108 Q 152 98 165 108" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
                </motion.g>
              )}
            </AnimatePresence>

            {/* dizzy: swirly eyes + circling stars */}
            <AnimatePresence>
              {dizzy && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {[88, 152].map((cx) => (
                    <g key={cx}>
                      <circle cx={cx} cy="106" r="18" fill="white" />
                      <motion.path
                        d={`M${cx} 106 m-9 0 a9 9 0 1 1 9 9 a6 6 0 1 1 -6 -6 a3 3 0 1 1 3 3`}
                        stroke={INK}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
                      />
                    </g>
                  ))}
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: "120px 20px" }}
                  >
                    {[0, 120, 240].map((a) => (
                      <text key={a} x={120 + 46 * Math.cos((a * Math.PI) / 180)} y={20 + 14 * Math.sin((a * Math.PI) / 180)} fontSize="18" textAnchor="middle">
                        ⭐
                      </text>
                    ))}
                  </motion.g>
                </motion.g>
              )}
            </AnimatePresence>

            {/* coin drops into the slot */}
            <AnimatePresence>
              {reaction?.kind === "coin" && (
                <motion.g
                  key={reaction.id}
                  initial={{ x: 120, y: -60, opacity: 0, rotate: -30 }}
                  animate={{ y: [-60, 40, 54], opacity: [0, 1, 1, 0], rotate: 0, scaleX: [1, 1, 0.3] }}
                  transition={{ duration: 0.7, times: [0, 0.75, 1], ease: "easeIn" }}
                >
                  <circle r="12" fill="#FFD166" stroke="#E8A93B" strokeWidth="2.5" />
                  <text textAnchor="middle" dy="4.5" fontSize="13" fontWeight="900" fill="#C98A1E">
                    £
                  </text>
                </motion.g>
              )}
            </AnimatePresence>

            {/* brows */}
            <AnimatePresence>
              {(pose === "encouraging" || pose === "thinking") && (
                <motion.g initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
                  <path d={pose === "encouraging" ? "M74 82 Q 86 76 100 84" : "M74 84 Q 86 78 100 82"} stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d={pose === "encouraging" ? "M140 84 Q 154 76 166 82" : "M140 80 Q 154 74 166 78"} stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </motion.g>
              )}
            </AnimatePresence>

            {/* cheeks */}
            <ellipse cx="64" cy="138" rx="13" ry="8" fill="#FF8FAB" opacity="0.5" />
            <ellipse cx="176" cy="138" rx="13" ry="8" fill="#FF8FAB" opacity="0.5" />

            {/* snout */}
            <motion.g
              key={reaction?.kind === "oink" ? reaction.id : "snout"}
              initial={reaction?.kind === "oink" ? { scale: 1.35 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 7 }}
              style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            >
              <ellipse cx="120" cy="140" rx="28" ry="19" fill="#FF9DB6" />
              <ellipse cx="110" cy="140" rx="4.5" ry="6.5" fill={SLOT} />
              <ellipse cx="130" cy="140" rx="4.5" ry="6.5" fill={SLOT} />
            </motion.g>

            {/* mouth */}
            {talking ? (
              <motion.ellipse
                cx="120"
                cy="171"
                rx="8"
                fill={INK}
                animate={{ ry: [2.5, 6, 3, 5.5, 2.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ) : pose === "celebrating" || reaction?.kind === "giggle" || reaction?.kind === "boing" || reaction?.kind === "spin" ? (
              <g>
                <path d="M104 164 Q 120 188 136 164 Z" fill={INK} strokeLinejoin="round" />
                <ellipse cx="120" cy="176" rx="7" ry="4" fill="#FF7E9D" />
              </g>
            ) : pose === "thinking" ? (
              <circle cx="124" cy="170" r="4" fill={INK} />
            ) : (
              <path
                d={pose === "encouraging" ? "M110 170 Q 120 175 130 170" : "M106 166 Q 120 178 134 166"}
                stroke={INK}
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
            )}

            {/* front feet */}
            <rect x="86" y="180" width="26" height="30" rx="11" fill={PINK_DARK} />
            <rect x="128" y="180" width="26" height="30" rx="11" fill={PINK_DARK} />
          </svg>
        </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
