"use client";

import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { ChevronDown, Activity, Shield, Cpu } from "lucide-react";
import { useRef } from "react";

export default function NexusIntro() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, -180]);

  const titleScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, 0.84]
  );

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.65],
    [1, 0]
  );

  const systemOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 0.8],
    [1, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      className="relative h-[120vh] overflow-hidden bg-neutral-950"
    >
      <div className="sticky top-0 flex min-h-screen items-center justify-center">

        {/* ========================================================= */}
        {/* GRID */}
        {/* ========================================================= */}

        <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />
        </div>

        {/* ========================================================= */}
        {/* AMBIENT GLOW */}
        {/* ========================================================= */}

        <motion.div
          animate={{
            opacity: [0.25, 0.45, 0.25],
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-cyan-500/[0.035] blur-3xl"
        />

        {/* ========================================================= */}
        {/* ROTATING SYSTEM RINGS */}
        {/* ========================================================= */}

        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear",
          }}
          className="pointer-events-none absolute h-[460px] w-[460px] rounded-full border border-cyan-500/[0.07]"
        >
          <div className="absolute left-1/2 top-0 h-1 w-10 -translate-x-1/2 rounded-full bg-cyan-400/60" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 42,
            repeat: Infinity,
            ease: "linear",
          }}
          className="pointer-events-none absolute h-[680px] w-[680px] rounded-full border border-neutral-800/50"
        >
          <div className="absolute right-[8%] top-1/2 h-px w-12 bg-cyan-400/20" />
        </motion.div>

        {/* ========================================================= */}
        {/* THIRD THIN RING */}
        {/* ========================================================= */}

        <motion.div
          animate={{
            rotate: 360,
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            rotate: {
              duration: 55,
              repeat: Infinity,
              ease: "linear",
            },
            opacity: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="pointer-events-none absolute h-[820px] w-[820px] rounded-full border border-cyan-500/[0.035]"
        />

        {/* ========================================================= */}
        {/* TOP LEFT SYSTEM READOUT */}
        {/* ========================================================= */}

        <motion.div
          style={{ opacity: systemOpacity }}
          className="absolute left-6 top-7 z-20 lg:left-10 lg:top-9"
        >
          <div className="flex items-center gap-3 font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-700">
            <motion.span
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.7,
                repeat: Infinity,
              }}
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
            />

            SYSTEM 01 / NEXUS
          </div>

          <div className="mt-3 font-mono text-[6px] uppercase tracking-[0.18em] text-neutral-800">
            ADAPTIVE RUNTIME CONTROL PLANE
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* TOP RIGHT SYSTEM READOUT */}
        {/* ========================================================= */}

        <motion.div
          style={{ opacity: systemOpacity }}
          className="absolute right-6 top-7 z-20 text-right font-mono text-[6px] uppercase tracking-[0.18em] lg:right-10 lg:top-9"
        >
          <div className="text-cyan-500/60">
            RUNTIME / ONLINE
          </div>

          <div className="mt-3 text-neutral-800">
            LOCAL INSTANCE
          </div>

          <div className="mt-1 text-neutral-800">
            SIGNAL 001
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* SIDE SIGNAL MARKERS */}
        {/* ========================================================= */}

        <motion.div
          style={{ opacity: systemOpacity }}
          className="absolute left-8 top-1/2 hidden -translate-y-1/2 lg:block"
        >
          <div className="space-y-6 font-mono text-[6px] uppercase tracking-[0.18em] text-neutral-800">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-neutral-900" />
              SYS
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-cyan-500/20" />
              TELEMETRY
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-neutral-900" />
              CONTROL
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: systemOpacity }}
          className="absolute right-8 top-1/2 hidden -translate-y-1/2 lg:block"
        >
          <div className="space-y-6 text-right font-mono text-[6px] uppercase tracking-[0.18em] text-neutral-800">
            <div className="flex items-center justify-end gap-3">
              THREAT
              <span className="h-px w-8 bg-neutral-900" />
            </div>

            <div className="flex items-center justify-end gap-3">
              RUNTIME
              <span className="h-px w-12 bg-cyan-500/20" />
            </div>

            <div className="flex items-center justify-end gap-3">
              STATE
              <span className="h-px w-6 bg-neutral-900" />
            </div>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* CENTER SYSTEM CROSSHAIR */}
        {/* ========================================================= */}

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-1/2 top-0 h-full w-px bg-neutral-900/70" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-neutral-900/70" />

          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.25, 0.65, 0.25],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]"
          />
        </div>

        {/* ========================================================= */}
        {/* SCANLINE */}
        {/* ========================================================= */}

        <motion.div
          animate={{
            y: ["-45vh", "45vh"],
            opacity: [0, 0.45, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
        />

        {/* ========================================================= */}
        {/* MAIN CONTENT */}
        {/* ========================================================= */}

        <motion.div
          style={{
            y: titleY,
            scale: titleScale,
            opacity: contentOpacity,
          }}
          className="relative z-10 max-w-5xl px-6 text-center"
        >
          {/* LABEL */}
          <div className="mb-6 flex items-center justify-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-cyan-500/70">
            <motion.span
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.7,
                repeat: Infinity,
              }}
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
            />

            SYSTEM 01 / NEXUS
          </div>

          {/* MAIN TITLE */}
          <h1 className="font-sans text-[clamp(4rem,10vw,8rem)] font-semibold leading-[0.82] tracking-[-0.095em] text-white">
            NEXUS
          </h1>

          {/* TITLE UNDERLINE */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "72px", opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: "easeOut",
            }}
            className="mx-auto mt-5 h-px bg-cyan-400/50"
          />

          {/* DESCRIPTOR */}
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500 sm:text-xs">
            ADAPTIVE RUNTIME CONTROL PLANE
          </div>

          {/* DESCRIPTION */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-600">
            Real-time telemetry, process analysis, and controlled runtime
            intervention brought together into one interface.
          </p>

          {/* CAPABILITY STRIP */}
          <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 border border-neutral-900 bg-neutral-950/60">
            {[
              ["TELEMETRY", Activity],
              ["PROCESS CONTROL", Cpu],
              ["RUNTIME STATE", Shield],
            ].map(([label, Icon], index) => (
              <motion.div
                key={label}
                whileHover={{
                  backgroundColor: "rgba(34,211,238,0.025)",
                }}
                className={`group flex flex-col items-center gap-2 px-3 py-4 transition-colors ${
                  index !== 0
                    ? "border-l border-neutral-900"
                    : ""
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-cyan-400/60 transition-colors duration-300 group-hover:text-cyan-300" />

                <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-neutral-700 transition-colors duration-300 group-hover:text-neutral-500">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* BUTTON */}
          <div className="mt-10 flex items-center justify-center">
            <a
              href="#nexus"
              className="group inline-flex items-center gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/[0.08]"
            >
              ENTER CONTROL PLANE

              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                →
              </motion.span>
            </a>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* BOTTOM TELEMETRY */}
        {/* ========================================================= */}

        <motion.div
          style={{ opacity: contentOpacity }}
          className="absolute bottom-7 left-0 right-0"
        >
          <div className="flex items-center justify-center gap-4 font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-800">
            <span>LOCAL INSTANCE</span>

            <span className="h-px w-8 bg-neutral-900" />

            <span>LIVE RUNTIME</span>

            <span className="h-px w-8 bg-neutral-900" />

            <span>SCROLL TO CONTINUE</span>
          </div>

          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mt-3 flex justify-center"
          >
            <ChevronDown className="h-4 w-4 text-neutral-700" />
          </motion.div>
        </motion.div>

        {/* ========================================================= */}
        {/* CORNER MARKERS */}
        {/* ========================================================= */}

        <div className="absolute bottom-8 left-6 hidden lg:block">
          <div className="h-4 w-4 border-b border-l border-neutral-800" />
        </div>

        <div className="absolute bottom-8 right-6 hidden lg:block">
          <div className="h-4 w-4 border-b border-r border-neutral-800" />
        </div>

        <div className="absolute left-6 top-24 hidden lg:block">
          <div className="h-4 w-4 border-l border-t border-neutral-800" />
        </div>

        <div className="absolute right-6 top-24 hidden lg:block">
          <div className="h-4 w-4 border-r border-t border-neutral-800" />
        </div>

      </div>
    </section>
  );
}