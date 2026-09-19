"use client";

import { motion } from "motion/react";

export default function SectionDivider() {
  return (
    <div className="relative flex h-10 items-center justify-center overflow-hidden bg-neutral-950">
      <motion.div
        animate={{
          opacity: [0.18, 0.55, 0.18],
          scaleX: [0.45, 1, 0.45],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="h-px w-40 bg-cyan-400/50 shadow-[0_0_14px_rgba(34,211,238,0.35)]"
      />

      <motion.div
        animate={{
          opacity: [0.15, 0.45, 0.15],
          scale: [0.7, 1.2, 0.7],
        }}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
      />
    </div>
  );
}