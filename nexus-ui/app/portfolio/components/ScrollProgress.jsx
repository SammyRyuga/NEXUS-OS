"use client";

import { motion, useScroll, useSpring } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.2,
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-px bg-neutral-900/80">
      <motion.div
        style={{ scaleX }}
        className="h-full origin-left bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.55)]"
      />
    </div>
  );
}