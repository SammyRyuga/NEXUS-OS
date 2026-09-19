"use client";

import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef } from "react";

const capabilities = [
  {
    index: "01",
    label: "OBSERVE",
    title: "Understand the runtime.",
    text: "NEXUS continuously surfaces system telemetry, process activity, resource pressure, and runtime state.",
    symbol: "◉",
  },
  {
    index: "02",
    label: "ANALYZE",
    title: "Interpret what is happening.",
    text: "Process behaviour and runtime signals are turned into an operator-facing view of what is active and where pressure is building.",
    symbol: "◇",
  },
  {
    index: "03",
    label: "CONTROL",
    title: "Intervene when necessary.",
    text: "Controlled process actions let the operator freeze, resume, or terminate selected workloads directly from the interface.",
    symbol: "□",
  },
];

function CapabilityCard({ item }) {
  const cardRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start 85%", "start 45%"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [0.35, 1, 1]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [35, 0, 0]
  );

  return (
    <motion.div
      ref={cardRef}
      style={{
        opacity,
        y,
      }}
      whileHover={{
        y: -6,
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      }}
      className="group relative min-h-[300px] overflow-hidden bg-neutral-950 p-7 lg:min-h-[360px] lg:p-9"
    >
      {/* TOP */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] tracking-[0.2em] text-neutral-700 transition-colors duration-300 group-hover:text-neutral-500">
          {item.index}
        </span>

        <span className="text-sm text-neutral-700 transition-all duration-300 group-hover:text-cyan-300 group-hover:[text-shadow:0_0_12px_rgba(34,211,238,0.45)]">
          {item.symbol}
        </span>
      </div>

      {/* CONTENT */}
      <div className="mt-20">
        <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-700 transition-colors duration-300 group-hover:text-cyan-400">
          {item.label}
        </div>

        <h3 className="mt-3 text-2xl font-medium tracking-[-0.035em] text-white transition-transform duration-300 group-hover:translate-x-1">
          {item.title}
        </h3>

        <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-600 transition-colors duration-300 group-hover:text-neutral-500">
          {item.text}
        </p>
      </div>

      {/* BOTTOM ACTIVE LINE */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-900">
        <div className="h-full w-0 bg-cyan-400 transition-all duration-500 ease-out group-hover:w-full" />
      </div>

      {/* LEFT ACTIVE EDGE */}
      <div className="absolute bottom-0 left-0 top-0 w-px bg-transparent transition-all duration-300 group-hover:bg-cyan-400/70 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.45)]" />

      {/* SUBTLE HOVER GLOW */}
      <div className="pointer-events-none absolute inset-0 bg-cyan-400/[0.015] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  );
}

export default function NexusOverview() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80%", "end 20%"],
  });

  const headingY = useTransform(
    scrollYProgress,
    [0, 1],
    [70, -30]
  );

  const headingOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.8],
    [0, 1, 1]
  );

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-neutral-900 bg-neutral-950"
    >
      <div className="mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-44">

        {/* HEADER */}
        <motion.div
          style={{
            y: headingY,
            opacity: headingOpacity,
          }}
          className="max-w-3xl"
        >
          <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-cyan-500/70">
            01 / NEXUS
          </div>

          <h2 className="mt-5 text-4xl font-medium tracking-[-0.05em] text-white sm:text-6xl">
            A runtime interface built around observation, analysis, and
            control.
          </h2>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-600">
            NEXUS brings live system signals and controlled process operations
            into a single operator-facing environment.
          </p>
        </motion.div>

        {/* CAPABILITIES */}
        <div className="mt-24 grid gap-px overflow-hidden border border-neutral-900 bg-neutral-950 lg:grid-cols-3">
          {capabilities.map((item) => (
            <CapabilityCard
              key={item.index}
              item={item}
            />
          ))}
        </div>

        {/* SYSTEM LABEL */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: 0.2,
          }}
          className="mt-14 flex items-center gap-4 font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-800"
        >
          <span>OBSERVE</span>

          <span className="h-px w-10 bg-neutral-900" />

          <span>ANALYZE</span>

          <span className="h-px w-10 bg-neutral-900" />

          <span>CONTROL</span>
        </motion.div>

      </div>
    </section>
  );
}