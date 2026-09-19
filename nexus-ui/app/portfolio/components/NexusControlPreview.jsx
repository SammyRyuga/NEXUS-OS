"use client";

import { useEffect, useMemo, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

const API_BASE =
    "https://jefferson-economic-altered-dublin.trycloudflare.com";

const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws";

const EMPTY_DATA = {
  system: {
    cpu: 0,
    memory: 0,
    power_watts: 0,
  },
  processes: [],
  events: [],
  nexus_status: "OPTIMAL",
};

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function useAnimatedNumber(value, options = {}) {
  const source = useMotionValue(Number(value) || 0);

  const spring = useSpring(source, {
    stiffness: options.stiffness ?? 110,
    damping: options.damping ?? 24,
    mass: options.mass ?? 0.7,
  });

  const [display, setDisplay] = useState(Number(value) || 0);

  useEffect(() => {
    source.set(Number(value) || 0);
  }, [value, source]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplay(latest);
    });
  }, [spring]);

  return display;
}

function statusVisual(status) {
  if (status === "CRITICAL") {
    return {
      text: "text-red-400",
      dot: "bg-red-400",
      glow: "shadow-[0_0_12px_rgba(248,113,113,0.8)]",
    };
  }

  if (status === "WARNING") {
    return {
      text: "text-amber-300",
      dot: "bg-amber-300",
      glow: "shadow-[0_0_12px_rgba(252,211,77,0.7)]",
    };
  }

  return {
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    glow: "shadow-[0_0_12px_rgba(34,211,238,0.7)]",
  };
}

export default function NexusControlPreview() {
  const [data, setData] = useState(EMPTY_DATA);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState("--:--:--");

  /* ========================================================= */
  /* LIVE BACKEND CONNECTION */
  /* ========================================================= */

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          setData({
            system: {
              cpu: Number(payload?.system?.cpu) || 0,
              memory: Number(payload?.system?.memory) || 0,
              power_watts:
                Number(payload?.system?.power_watts) || 0,
            },
            processes: Array.isArray(payload?.processes)
              ? payload.processes
              : [],
            events: Array.isArray(payload?.events)
              ? payload.events
              : [],
            nexus_status:
              payload?.nexus_status || "OPTIMAL",
          });

          setLastSync(
            new Date().toLocaleTimeString([], {
              hour12: false,
            }),
          );
        } catch {
          // Ignore malformed telemetry frames.
        }
      };

      socket.onclose = () => {
        setConnected(false);

        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => {
        setConnected(false);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);

      if (socket) {
        socket.close();
      }
    };
  }, []);

  /* ========================================================= */
  /* LIVE TELEMETRY */
  /* ========================================================= */

  const cpu = clamp(data.system.cpu);
  const memory = clamp(data.system.memory);
  const power = Number(data.system.power_watts) || 0;
  const processCount = data.processes.length;

  const animatedCpu = useAnimatedNumber(cpu, {
    stiffness: 100,
    damping: 22,
    mass: 0.6,
  });

  const animatedMemory = useAnimatedNumber(memory, {
    stiffness: 105,
    damping: 24,
    mass: 0.65,
  });

  const animatedPower = useAnimatedNumber(power, {
    stiffness: 90,
    damping: 25,
    mass: 0.7,
  });

  const animatedProcesses = useAnimatedNumber(processCount, {
    stiffness: 120,
    damping: 26,
    mass: 0.6,
  });

  const systemStatus = statusVisual(data.nexus_status);

  const activeWorkload = useMemo(() => {
    const target = data.processes.find((process) =>
      String(process.name || "")
        .toLowerCase()
        .includes("malicious_workload.py"),
    );

    return target || data.processes[0] || null;
  }, [data.processes]);

  const workloadName =
    activeWorkload?.name || "NO ACTIVE TARGET";

  const workloadPid =
    activeWorkload?.pid != null
      ? `PID ${activeWorkload.pid}`
      : "WAITING";

  /* ========================================================= */
  /* MOUSE MOVEMENT */
  /* ========================================================= */

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, {
    stiffness: 80,
    damping: 20,
    mass: 0.2,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 80,
    damping: 20,
    mass: 0.2,
  });

  const coreX = useTransform(
    smoothX,
    [-1, 1],
    [-10, 10],
  );

  const coreY = useTransform(
    smoothY,
    [-1, 1],
    [-10, 10],
  );

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    mouseX.set((x - 0.5) * 2);
    mouseY.set((y - 0.5) * 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const pulseDuration = Math.max(
    1.4,
    4.2 - cpu / 30,
  );

  return (
    <section className="relative overflow-hidden border-b border-neutral-900 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-44">

        {/* ======================================================= */}
        {/* HEADER */}
        {/* ======================================================= */}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-cyan-500/70">
              02 / CONTROL CENTRE
            </div>

            <h2 className="mt-5 text-4xl font-medium tracking-[-0.05em] text-white sm:text-6xl">
              The runtime, visualized.
            </h2>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-600">
              NEXUS turns live runtime signals into an operator-facing control
              surface for understanding system state and active workloads.
            </p>
          </div>

          <a
            href="/nexus"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-fit items-center gap-4 border border-neutral-800 px-5 py-3 font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-500 transition-all duration-300 hover:border-cyan-500/40 hover:text-cyan-300"
          >
            VIEW FULL CONTROL PLANE

            <span className="text-sm transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
              ↗
            </span>
          </a>
        </div>

        {/* ======================================================= */}
        {/* CONTROL PANEL */}
        {/* ======================================================= */}

        <div className="relative mt-20 overflow-hidden border border-neutral-900 bg-black">

          {/* TOP BAR */}

          <div className="flex h-11 items-center justify-between border-b border-neutral-900 px-5">
            <div className="flex items-center gap-3">
              <span
                className={`h-1.5 w-1.5 rounded-full ${systemStatus.dot} ${systemStatus.glow}`}
              />

              <span className="font-mono text-[8px] tracking-[0.22em] text-neutral-500">
                NEXUS / RUNTIME CONTROL PLANE
              </span>
            </div>

            <div className="flex items-center gap-5 font-mono text-[7px] tracking-[0.18em]">
              <span className="text-neutral-700">
                LAST SYNC {lastSync}
              </span>

              <span
                className={
                  connected
                    ? "text-cyan-500"
                    : "text-red-400"
                }
              >
                {connected ? "CONNECTED" : "OFFLINE"}
              </span>
            </div>
          </div>

          {/* ===================================================== */}
          {/* MAIN VISUAL */}
          {/* ===================================================== */}

          <div
            className="relative min-h-[620px] overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >

            {/* GRID */}

            <div
              className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />

            {/* AMBIENT GLOW */}

            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.035] blur-3xl" />

            {/* =================================================== */}
            {/* LEFT TELEMETRY */}
            {/* =================================================== */}

            <div className="absolute left-6 top-8 w-44 space-y-3 lg:left-8 lg:top-10">
              {[
                ["CPU", `${animatedCpu.toFixed(1)}%`, "LIVE", cpu],
                [
                  "MEMORY",
                  `${animatedMemory.toFixed(1)}%`,
                  "LIVE",
                  memory,
                ],
                [
                  "POWER",
                  `${animatedPower.toFixed(1)} W`,
                  "LIVE",
                  Math.min((power / 95) * 100, 100),
                ],
                [
                  "PROCESSES",
                  `${Math.round(animatedProcesses)}`,
                  connected ? "ACTIVE" : "WAITING",
                  Math.min(processCount * 12.5, 100),
                ],
              ].map(([label, value, state, width], index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.08,
                  }}
                  className="border border-neutral-900 bg-neutral-950/80 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[7px] tracking-[0.18em] text-neutral-700">
                      {label}
                    </span>

                    <span className="font-mono text-[6px] tracking-[0.16em] text-cyan-500/60">
                      {state}
                    </span>
                  </div>

                  <div className="mt-3 font-mono text-lg text-neutral-300">
                    {value}
                  </div>

                  <div className="mt-3 h-px bg-neutral-900">
                    <motion.div
                      animate={{
                        width: `${Math.max(
                          0,
                          Math.min(width, 100),
                        )}%`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 24,
                      }}
                      className="h-px bg-cyan-400/50"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* =================================================== */}
            {/* CENTRAL CORE */}
            {/* =================================================== */}

            <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 lg:h-[410px] lg:w-[410px]">

              {/* THIS IS THE MOUSE-RESPONSIVE LAYER */}

              <motion.div
                style={{
                  x: coreX,
                  y: coreY,
                }}
                className="absolute inset-0"
              >

                {/* OUTER RING */}

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 34,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 rounded-full border border-cyan-500/[0.10]"
                >
                  <div className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
                </motion.div>

                {/* SECOND RING */}

                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-8 rounded-full border border-neutral-800 border-dashed"
                />

                {/* INNER RING */}

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-16 rounded-full border border-cyan-500/20"
                />

                {/* PULSE RING */}

                <motion.div
                  animate={{
                    scale: [1, 1.04, 1],
                    opacity: [0.2, 0.45, 0.2],
                  }}
                  transition={{
                    duration: pulseDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-24 rounded-full border border-cyan-400/30"
                />

                {/* CORE */}

                <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-500/20 bg-neutral-950 shadow-[0_0_80px_rgba(34,211,238,0.06)] lg:h-44 lg:w-44">

                  <div className="font-mono text-[7px] uppercase tracking-[0.25em] text-neutral-700">
                    RUNTIME
                  </div>

                  <div className="mt-3 font-mono text-3xl tracking-[-0.05em] text-white">
                    {animatedCpu.toFixed(1)}%
                  </div>

                  <div
                    className={`mt-2 flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] ${systemStatus.text}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${systemStatus.dot} ${systemStatus.glow}`}
                    />

                    {data.nexus_status}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* =================================================== */}
            {/* RIGHT STATE */}
            {/* =================================================== */}

            <div className="absolute right-6 top-8 w-44 space-y-3 lg:right-8 lg:top-10">

              <div className="border border-neutral-900 bg-neutral-950/80 p-4">
                <div className="font-mono text-[7px] tracking-[0.18em] text-neutral-700">
                  RUNTIME STATE
                </div>

                <div
                  className={`mt-4 flex items-center gap-3 font-mono text-xs tracking-[0.15em] ${systemStatus.text}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${systemStatus.dot} ${systemStatus.glow}`}
                  />

                  {data.nexus_status}
                </div>
              </div>

              <div className="border border-neutral-900 bg-neutral-950/80 p-4">
                <div className="font-mono text-[7px] tracking-[0.18em] text-neutral-700">
                  ACTIVE WORKLOAD
                </div>

                <div className="mt-4 truncate font-mono text-xs text-neutral-400">
                  {workloadName}
                </div>

                <div className="mt-2 font-mono text-[7px] tracking-[0.15em] text-neutral-700">
                  {workloadPid}
                </div>
              </div>

              <div className="border border-neutral-900 bg-neutral-950/80 p-4">
                <div className="font-mono text-[7px] tracking-[0.18em] text-neutral-700">
                  CONTROL
                </div>

                <div className="mt-4 grid grid-cols-3 gap-1">
                  {["FREEZE", "RESUME", "KILL"].map((item) => (
                    <div
                      key={item}
                      className="border border-neutral-900 py-2 text-center font-mono text-[6px] tracking-[0.1em] text-neutral-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* =================================================== */}
            {/* EVENT STREAM */}
            {/* =================================================== */}

            <div className="absolute bottom-6 left-6 right-6 border-t border-neutral-900 pt-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-700">
                  RUNTIME EVENT STREAM
                </div>

                <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-800">
                  <span className="h-1 w-1 rounded-full bg-cyan-400" />
                  LIVE
                </div>
              </div>

              <div className="mt-4 grid gap-2 font-mono text-[7px] text-neutral-700 sm:grid-cols-3">
                <span>
                  SYS / {connected ? "TELEMETRY LIVE" : "CONNECTING"}
                </span>

                <span>
                  PROC / {String(processCount).padStart(2, "0")} ACTIVE
                </span>

                <span className="sm:text-right">
                  STATE / {data.nexus_status}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-6 grid grid-cols-3 font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-800">
          <span>OBSERVE</span>
          <span className="text-center">ANALYZE</span>
          <span className="text-right">CONTROL</span>
        </div>
      </div>
    </section>
  );
}