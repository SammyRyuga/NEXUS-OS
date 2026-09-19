"use client";

import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef } from "react";

const layers = [
  {
    number: "01",
    label: "TELEMETRY",
    title: "Observe",
    text: "System and workload signals are continuously collected from the host runtime.",
    items: ["CPU", "MEMORY", "POWER", "PROCESSES"],
  },
  {
    number: "02",
    label: "RUNTIME ENGINE",
    title: "Analyze",
    text: "Signals are interpreted into runtime state, workload pressure, and operator-facing events.",
    items: ["STATE", "THREAT", "EVENTS", "TOPOLOGY"],
  },
  {
    number: "03",
    label: "CONTROL API",
    title: "Control",
    text: "Operator actions are exposed through a controlled interface for selected workloads.",
    items: ["FREEZE", "RESUME", "TERMINATE", "RECOVER"],
  },
];

function ArchitectureLayer({ layer, index }) {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "center center"],
  });

  const xOffsets = [-140, 0, 140];

  const x = useTransform(
    scrollYProgress,
    [0, 0.7, 1],
    [xOffsets[index], 0, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.7, 1],
    [45, 0, 0]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.45, 0.8],
    [0, 0.55, 1]
  );

  const signalOpacity = useTransform(
    scrollYProgress,
    [0, 0.55, 0.8, 1],
    [0.1, 0.25, 1, 1]
  );

  const lineScale = useTransform(
    scrollYProgress,
    [0, 0.65, 1],
    [0, 1, 1]
  );

  return (
    <motion.div
      ref={ref}
      style={{
        x,
        y,
        opacity,
      }}
      className="group relative border border-neutral-900 bg-neutral-950"
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between border-b border-neutral-900 px-6 py-5">
        <span className="font-mono text-[8px] tracking-[0.2em] text-neutral-700">
          {layer.number}
        </span>

        <motion.span
          style={{ opacity: signalOpacity }}
          className="font-mono text-[7px] tracking-[0.18em] text-cyan-500/60"
        >
          {layer.label}
        </motion.span>
      </div>

      {/* BODY */}
      <div className="p-7 lg:p-8">
        <div className="mb-8 flex items-center gap-4">
          <motion.div
            style={{ opacity: signalOpacity }}
            className="flex h-10 w-10 items-center justify-center border border-cyan-500/20"
          >
            <motion.div
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.35, 1, 0.35],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: index * 0.4,
                ease: "easeInOut",
              }}
              className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.6)]"
            />
          </motion.div>

          <div>
            <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-700">
              LAYER
            </div>

            <div className="mt-1 text-xl tracking-[-0.03em] text-white">
              {layer.title}
            </div>
          </div>
        </div>

        <p className="max-w-sm text-sm leading-6 text-neutral-600">
          {layer.text}
        </p>

        {/* SIGNALS */}
        <div className="mt-10 space-y-2">
          {layer.items.map((item, itemIndex) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                delay: index * 0.1 + itemIndex * 0.05,
                duration: 0.4,
              }}
              className="flex items-center justify-between border-t border-neutral-900 py-3"
            >
              <span className="font-mono text-[7px] tracking-[0.18em] text-neutral-600">
                {item}
              </span>

              <motion.span
                style={{ opacity: signalOpacity }}
                className="h-1 w-1 rounded-full bg-cyan-400"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* HOVER LINE */}
      <div className="absolute bottom-0 left-0 h-px w-0 bg-cyan-400 transition-all duration-500 group-hover:w-full" />

      {/* ACTIVE EDGE */}
      <motion.div
        style={{ opacity: signalOpacity }}
        className="absolute bottom-0 left-0 top-0 w-px bg-cyan-400/60"
      />

      {/* SCROLL LINE */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-900">
        <motion.div
          style={{ scaleX: lineScale }}
          className="h-full origin-left bg-cyan-400/40"
        />
      </div>
    </motion.div>
  );
}

export default function NexusArchitecture() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-900 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-44">

        {/* HEADER */}
        <div className="max-w-3xl">
          <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-cyan-500/70">
            03 / ARCHITECTURE
          </div>

          <h2 className="mt-5 text-4xl font-medium tracking-[-0.05em] text-white sm:text-6xl">
            A control plane built around a simple runtime loop.
          </h2>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-600">
            NEXUS connects observation, runtime interpretation, and controlled
            intervention into one operator-facing system.
          </p>
        </div>

        {/* ARCHITECTURE */}
        <div className="relative mt-24">

          {/* STATIC CONNECTION */}
          <div className="absolute left-[8%] right-[8%] top-[92px] hidden h-px bg-neutral-900 lg:block" />

          {/* MOVING CONNECTION SIGNAL */}
          <motion.div
            animate={{
              x: ["0%", "100%"],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute left-[8%] top-[91px] hidden h-px w-14 bg-cyan-400/50 lg:block"
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {layers.map((layer, index) => (
              <ArchitectureLayer
                key={layer.number}
                layer={layer}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* RUNTIME PIPELINE */}
        <div className="mt-16 border border-neutral-900 bg-black">
          <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-4">
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-700">
              RUNTIME PIPELINE
            </span>

            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-cyan-500/50">
              CONTINUOUS
            </span>
          </div>

          <div className="grid divide-y divide-neutral-900 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            {[
              "HOST",
              "TELEMETRY",
              "ANALYSIS",
              "DECISION",
              "ACTION",
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                className="relative px-5 py-7"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[7px] tracking-[0.18em] text-neutral-700">
                    0{index + 1}
                  </span>

                  <motion.span
                    animate={{
                      opacity: [0.2, 1, 0.2],
                      scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: index * 0.35,
                      ease: "easeInOut",
                    }}
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                  />
                </div>

                <motion.div
                  animate={{
                    color: [
                      "rgb(115,115,115)",
                      "rgb(255,255,255)",
                      "rgb(115,115,115)",
                    ],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: index * 0.35,
                    ease: "easeInOut",
                  }}
                  className="mt-4 text-sm tracking-[-0.02em]"
                >
                  {item}
                </motion.div>

                <div className="mt-5 h-px bg-neutral-900">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 1.2,
                      delay: index * 0.25,
                      ease: "easeOut",
                    }}
                    className="h-px bg-cyan-400/40"
                  />
                </div>

                {index < 4 && (
                  <motion.span
                    animate={{
                      opacity: [0, 1, 0],
                      x: [0, 6, 12],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: index * 0.35,
                      ease: "easeInOut",
                    }}
                    className="absolute right-[-4px] top-1/2 hidden h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-cyan-400/40 bg-black sm:block"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-800">
          <span>OBSERVE</span>
          <span>INTERPRET</span>
          <span>INTERVENE</span>
        </div>

      </div>
    </section>
  );
}