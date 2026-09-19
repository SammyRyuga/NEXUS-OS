"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export default function NexusTransition() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "end 10%"],
  });

  const lineScale = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  const glowOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.65, 1],
    [0, 0.35, 0.35, 0],
  );

  const textOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0],
  );

  const textY = useTransform(
    scrollYProgress,
    [0, 1],
    [20, -20],
  );

  return (
    <div
      ref={ref}
      className="pointer-events-none relative h-24 overflow-hidden bg-neutral-950"
    >
      <motion.div
        style={{ opacity: glowOpacity }}
        className="absolute left-1/2 top-1/2 h-32 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.04] blur-3xl"
      />

      <div className="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-4">
        <motion.div
          style={{ scaleX: lineScale }}
          className="h-px w-20 origin-right bg-cyan-500/30"
        />

        <motion.div
          style={{
            opacity: textOpacity,
            y: textY,
          }}
          className="font-mono text-[7px] uppercase tracking-[0.28em] text-neutral-700"
        >
          RUNTIME → SYSTEM
        </motion.div>

        <motion.div
          style={{ scaleX: lineScale }}
          className="h-px w-20 origin-left bg-cyan-500/30"
        />
      </div>
    </div>
  );
}