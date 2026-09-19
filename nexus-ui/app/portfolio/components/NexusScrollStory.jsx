"use client";

import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { Activity, BrainCircuit, Shield } from "lucide-react";
import { useRef } from "react";

const stages = [
  {
    label: "OBSERVE",
    title: "Capture the runtime.",
    text: "Telemetry and workload signals enter the system.",
    icon: Activity,
  },
  {
    label: "ANALYZE",
    title: "Understand behaviour.",
    text: "Signals become runtime state and operator-facing insight.",
    icon: BrainCircuit,
  },
  {
    label: "CONTROL",
    title: "Act on the system.",
    text: "Selected workloads can be controlled directly.",
    icon: Shield,
  },
];

export default function NexusScrollStory() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /* -------------------------------------------------- */
  /* STAGE 1 */
  /* -------------------------------------------------- */

  const observeX = useTransform(
    scrollYProgress,
    [0, 0.28],
    [-360, 0]
  );

  const observeOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.35],
    [0, 1, 1]
  );

  /* -------------------------------------------------- */
  /* STAGE 2 */
  /* -------------------------------------------------- */

  const analyzeX = useTransform(
    scrollYProgress,
    [0.18, 0.5],
    [360, 0]
  );

  const analyzeOpacity = useTransform(
    scrollYProgress,
    [0.18, 0.32, 0.62],
    [0, 1, 1]
  );

  /* -------------------------------------------------- */
  /* STAGE 3 */
  /* -------------------------------------------------- */

  const controlY = useTransform(
    scrollYProgress,
    [0.42, 0.72],
    [220, 0]
  );

  const controlOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.55, 0.85],
    [0, 1, 1]
  );

  /* -------------------------------------------------- */
  /* CORE */
  /* -------------------------------------------------- */

  const coreScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    [0.75, 1, 1.05, 0.92]
  );

  const coreOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.9, 1],
    [0.3, 1, 1, 0.2]
  );

  const ringRotation = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 180]
  );

  const centerText = useTransform(
    scrollYProgress,
    [0, 0.3, 0.65, 1],
    ["OBSERVE", "ANALYZE", "CONTROL", "NEXUS"]
  );

  return (
    <section
      ref={sectionRef}
      className="relative h-[240vh] border-b border-neutral-900 bg-neutral-950"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">

        {/* GRID */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        {/* LABEL */}
        <div className="absolute left-6 top-8 font-mono text-[7px] uppercase tracking-[0.24em] text-neutral-700 lg:left-10">
          01A / RUNTIME SEQUENCE
        </div>

        <div className="absolute right-6 top-8 font-mono text-[7px] uppercase tracking-[0.24em] text-cyan-500/50 lg:right-10">
          SCROLL / LIVE
        </div>

        {/* CENTRAL CORE */}
        <motion.div
          style={{
            scale: coreScale,
            opacity: coreOpacity,
          }}
          className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 sm:h-[390px] sm:w-[390px] lg:h-[460px] lg:w-[460px]"
        >
          {/* OUTER RING */}
          <motion.div
            style={{ rotate: ringRotation }}
            className="absolute inset-0 rounded-full border border-cyan-500/10"
          >
            <div className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.7)]" />
          </motion.div>

          {/* DASHED RING */}
          <div className="absolute inset-10 rounded-full border border-neutral-800 border-dashed" />

          {/* INNER RING */}
          <div className="absolute inset-20 rounded-full border border-cyan-500/10" />

          {/* CROSSHAIR */}
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 h-full w-px bg-neutral-900" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-neutral-900" />
          </div>

          {/* CORE */}
          <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-500/20 bg-neutral-950 shadow-[0_0_80px_rgba(34,211,238,.06)] sm:h-40 sm:w-40">
            <motion.div className="text-center font-mono">
              <div className="text-[7px] tracking-[0.25em] text-neutral-700">
                NEXUS
              </div>

              <motion.div className="mt-3 text-lg tracking-[0.18em] text-white sm:text-xl">
                {centerText}
              </motion.div>

              <div className="mt-3 flex items-center justify-center gap-2 text-[6px] tracking-[0.18em] text-cyan-500/60">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                ACTIVE
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* OBSERVE */}
        <motion.div
          style={{
            x: observeX,
            opacity: observeOpacity,
          }}
          className="absolute left-6 top-[24%] w-[260px] lg:left-[12%] lg:w-[320px]"
        >
          <StageCard stage={stages[0]} />
        </motion.div>

        {/* ANALYZE */}
        <motion.div
          style={{
            x: analyzeX,
            opacity: analyzeOpacity,
          }}
          className="absolute right-6 top-[42%] w-[260px] lg:right-[12%] lg:w-[320px]"
        >
          <StageCard stage={stages[1]} />
        </motion.div>

        {/* CONTROL */}
        <motion.div
          style={{
            y: controlY,
            opacity: controlOpacity,
          }}
          className="absolute bottom-[10%] left-1/2 w-[280px] -translate-x-1/2 lg:w-[340px]"
        >
          <StageCard stage={stages[2]} />
        </motion.div>

        {/* PROGRESS MARKER */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 font-mono text-[6px] uppercase tracking-[0.2em] text-neutral-800">
          <span>OBSERVE</span>
          <span className="h-px w-6 bg-neutral-900" />
          <span>ANALYZE</span>
          <span className="h-px w-6 bg-neutral-900" />
          <span>CONTROL</span>
        </div>
      </div>
    </section>
  );
}

function StageCard({ stage }) {
  const Icon = stage.icon;

  return (
    <div className="relative border border-neutral-900 bg-neutral-950/90 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[7px] tracking-[0.2em] text-neutral-700">
          RUNTIME STAGE
        </span>

        <Icon className="h-4 w-4 text-cyan-500/60" />
      </div>

      <div className="mt-6 font-mono text-[8px] uppercase tracking-[0.22em] text-cyan-500/70">
        {stage.label}
      </div>

      <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
        {stage.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-neutral-600">
        {stage.text}
      </p>

      <div className="mt-6 h-px bg-neutral-900">
        <motion.div
          animate={{
            width: ["20%", "70%", "20%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-px bg-cyan-400/50"
        />
      </div>
    </div>
  );
}