"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Cpu,
  HardDrive,
  Loader2,
  Pause,
  Play,
  Power,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Skull,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

const API_BASE = "http://localhost:8000";
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
  const {
    stiffness = 110,
    damping = 24,
    mass = 0.7,
  } = options;

  const source = useMotionValue(Number(value) || 0);

  const spring = useSpring(source, {
    stiffness,
    damping,
    mass,
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

function statusConfig(status) {
  if (status === "CRITICAL") {
    return {
      label: "CRITICAL",
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      dot: "bg-red-400",
      glow: "shadow-[0_0_12px_rgba(248,113,113,0.8)]",
    };
  }

  if (status === "WARNING") {
    return {
      label: "WARNING",
      text: "text-amber-300",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      dot: "bg-amber-300",
      glow: "shadow-[0_0_12px_rgba(252,211,77,0.7)]",
    };
  }

  return {
    label: "OPTIMAL",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.7)]",
  };
}

function severityConfig(severity) {
  switch (String(severity).toUpperCase()) {
    case "CRITICAL":
      return {
        text: "text-red-400",
        dot: "bg-red-400",
        border: "border-red-500/20",
        bg: "bg-red-500/[0.035]",
      };

    case "WARNING":
      return {
        text: "text-amber-300",
        dot: "bg-amber-300",
        border: "border-amber-500/20",
        bg: "bg-amber-500/[0.025]",
      };

    default:
      return {
        text: "text-neutral-400",
        dot: "bg-neutral-600",
        border: "border-neutral-800",
        bg: "bg-neutral-950/30",
      };
  }
}

function threatConfig(score) {
  if (score >= 80) {
    return {
      label: "CRITICAL",
      text: "text-red-400",
      gradient: "from-red-700 via-red-500 to-red-300",
      glow: "shadow-[0_0_12px_rgba(239,68,68,0.45)]",
    };
  }

  if (score >= 50) {
    return {
      label: "ELEVATED",
      text: "text-amber-300",
      gradient: "from-amber-700 via-amber-500 to-yellow-300",
      glow: "",
    };
  }

  if (score > 0) {
    return {
      label: "MONITORED",
      text: "text-cyan-300",
      gradient: "from-cyan-800 via-cyan-500 to-blue-400",
      glow: "",
    };
  }

  return {
    label: "CLEAR",
    text: "text-neutral-600",
    gradient: "from-neutral-800 to-neutral-600",
    glow: "",
  };
}

function SectionHeader({ index, label, icon }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/70 text-cyan-300">
        {icon}
      </div>

      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em]">
        <span className="text-neutral-700">{index}</span>
        <span className="text-neutral-500">/</span>
        <span className="text-neutral-500">{label}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  percent,
  icon,
  hot = false,
  suffix = "",
  decimals = 1,
}) {
  const animatedPercent = useAnimatedNumber(percent, {
    stiffness: 90,
    damping: 22,
    mass: 0.65,
  });

  const width = clamp(animatedPercent);
  const animatedValue = animatedPercent;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 transition-colors hover:border-neutral-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              hot
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-cyan-500/15 bg-cyan-500/5 text-cyan-300"
            }`}
          >
            {icon}
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-600">
            {label}
          </span>
        </div>

        <span className="font-mono text-[9px] text-neutral-700">
          {Math.round(animatedPercent)}%
        </span>
      </div>

      <div
        className={`mt-4 font-mono text-2xl font-medium ${
          hot ? "text-red-400" : "text-neutral-100"
        }`}
      >
        {animatedValue.toFixed(decimals)}
        {suffix}
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-neutral-900">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${
            hot
              ? "bg-gradient-to-r from-red-800 via-red-500 to-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              : "bg-gradient-to-r from-cyan-800 via-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function TelemetryTrace({ label, value, suffix = "", samples, maxValue = 100 }) {
  const width = 420;
  const height = 72;
  const padding = 6;

  const points = samples.length
    ? samples.map((sample, index) => {
        const x =
          padding +
          (index / Math.max(samples.length - 1, 1)) *
            (width - padding * 2);

        const normalized = Math.min(
          Math.max(Number(sample) / maxValue, 0),
          1,
        );

        const y =
          height -
          padding -
          normalized * (height - padding * 2);

        return `${x},${y}`;
      })
    : `${padding},${height / 2}`;

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/70 p-4"
    >
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-neutral-500">
            {label}
          </div>

          <div className="mt-1 font-mono text-xl tracking-tight text-neutral-100">
            {Number(value).toFixed(1)}
            <span className="ml-1 text-[10px] text-neutral-500">
              {suffix}
            </span>
          </div>
        </div>

        <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-500/70">
          LIVE
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-20 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={`trace-${label.replace(/\s+/g, "-")}`}
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop offset="0%" stopColor="rgba(34,211,238,0.10)" />
            <stop offset="65%" stopColor="rgba(34,211,238,0.45)" />
            <stop offset="100%" stopColor="rgba(103,232,249,0.95)" />
          </linearGradient>
        </defs>

        <line
          x1="0"
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke="rgba(255,255,255,0.06)"
        />

        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="rgba(255,255,255,0.035)"
        />

        <motion.polyline
          fill="none"
          stroke={`url(#trace-${label.replace(/\s+/g, "-")})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />

        {samples.length > 0 && (
          <motion.circle
            cx={Number(points[points.length - 1]?.split(",")[0] ?? 0)}
            cy={Number(points[points.length - 1]?.split(",")[1] ?? height / 2)}
            r="2.5"
            fill="rgb(103 232 249)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </svg>

      <div className="mt-1 flex justify-between font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-700">
        <span>-30 S</span>
        <span>NOW</span>
      </div>
    </motion.div>
  );
}

function ActionButton({
  label,
  icon,
  disabled,
  loading,
  danger,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] transition ${
        danger
          ? "border-red-500/15 bg-red-500/[0.03] text-red-400 hover:border-red-500/30 hover:bg-red-500/[0.08]"
          : "border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:border-cyan-500/25 hover:bg-cyan-500/[0.05] hover:text-cyan-300"
      } disabled:cursor-not-allowed disabled:opacity-20`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        icon
      )}
      {loading ? "WORKING" : label}
    </button>
  );
}

function ProcessStatus({ status }) {
  const normalized = String(status).toLowerCase();

  if (normalized === "stopped") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-sky-300">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        STOPPED
      </span>
    );
  }

  if (normalized === "sleeping") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        SLEEPING
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      RUNNING
    </span>
  );
}

function ProcessRow({
  process,
  actionState,
  executeAction,
  selected,
  onSelect,
}) {
  const stopped = String(process.status).toLowerCase() === "stopped";

  const animatedCpu = useAnimatedNumber(process.cpu, {
    stiffness: 120,
    damping: 24,
    mass: 0.55,
  });

  const animatedThreat = useAnimatedNumber(process.threat_score, {
    stiffness: 95,
    damping: 23,
    mass: 0.65,
  });

  const threat = threatConfig(animatedThreat);

  const freezing = actionState === `${process.pid}-freeze`;
  const resuming = actionState === `${process.pid}-resume`;
  const terminating = actionState === `${process.pid}-kill`;

  const operation = freezing
    ? "FREEZING"
    : resuming
      ? "RESUMING"
      : terminating
        ? "TERMINATING"
        : null;

  return (
    <motion.div
      layout
      onClick={onSelect}
      initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 18, filter: "blur(4px)" }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 32,
      }}
      className={`relative grid cursor-pointer gap-4 overflow-hidden border-b border-neutral-900 px-4 py-4 last:border-b-0 md:grid-cols-[72px_minmax(170px,1.5fr)_90px_200px_105px_minmax(280px,.9fr)] md:items-center ${
        selected
          ? "bg-cyan-500/[0.035] shadow-[inset_2px_0_0_rgba(34,211,238,0.8)]"
          : stopped
            ? "bg-sky-500/[0.015] opacity-55"
            : "hover:bg-white/[0.012]"
      }`}
    >
      <AnimatePresence>
        {operation && (
          <>
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.8 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`absolute left-0 right-0 top-0 h-px origin-left ${
                terminating ? "bg-red-400" : "bg-cyan-400"
              }`}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute right-4 top-1.5 font-mono text-[7px] uppercase tracking-[0.18em] ${
                terminating ? "text-red-400" : "text-cyan-300"
              }`}
            >
              {operation}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="font-mono text-xs text-neutral-500">
        {process.pid}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              animatedThreat >= 80
                ? "animate-pulse bg-red-400"
                : stopped
                  ? "bg-sky-400"
                  : "bg-cyan-400"
            }`}
          />

          <span className="truncate font-mono text-xs text-neutral-200">
            {process.name}
          </span>
        </div>
      </div>

      <div className="font-mono text-xs text-neutral-400">
        {animatedCpu.toFixed(1)}%
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span
            className={`font-mono text-[8px] uppercase tracking-[0.15em] ${threat.text}`}
          >
            {threat.label}
          </span>

          <span className="font-mono text-[10px] text-neutral-500">
            {Math.round(clamp(animatedThreat))}
          </span>
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-neutral-900">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${threat.gradient} ${threat.glow} transition-[width] duration-700`}
            style={{
              width: `${clamp(animatedThreat)}%`,
            }}
          />
        </div>
      </div>

      <div>
        <ProcessStatus status={process.status} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <ActionButton
          label="Freeze"
          icon={<Pause className="h-3 w-3" />}
          disabled={stopped}
          loading={actionState === `${process.pid}-freeze`}
          onClick={() => executeAction(process.pid, "freeze")}
        />

        <ActionButton
          label="Resume"
          icon={<Play className="h-3 w-3" />}
          disabled={!stopped}
          loading={actionState === `${process.pid}-resume`}
          onClick={() => executeAction(process.pid, "resume")}
        />

        <ActionButton
          label="Terminate"
          icon={<Skull className="h-3 w-3" />}
          danger
          loading={actionState === `${process.pid}-kill`}
          onClick={() => executeAction(process.pid, "kill")}
        />
      </div>
    </motion.div>
  );
}

function TopologyNode({ node, depth, isRoot }) {
  const stopped = String(node.status).toLowerCase() === "stopped";
  const animatedCpu = useAnimatedNumber(node.cpu, {
    stiffness: 120,
    damping: 24,
    mass: 0.55,
  });

  const cpuWidth = Math.min(Math.max(animatedCpu, 0), 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -14, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -10, filter: "blur(3px)" }}
      transition={{
        type: "spring",
        stiffness: 360,
        damping: 28,
      }}
      className="relative"
      style={{
        marginLeft: depth * 34,
      }}
    >
      {/* vertical process rail */}
      {depth > 0 && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-neutral-800"
          style={{ left: -18 }}
        />
      )}

      {/* connector into node */}
      {depth > 0 && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-none absolute left-[-18px] top-1/2 h-px w-[18px] origin-left bg-neutral-700"
        />
      )}

      <motion.div
        whileHover={{
          x: 3,
          borderColor: "rgba(34,211,238,0.25)",
        }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/70 px-4 py-3"
      >
        {/* active edge */}
        <motion.div
          animate={{
            opacity: stopped ? 0.25 : [0.25, 0.7, 0.25],
          }}
          transition={{
            duration: 2.2,
            repeat: stopped ? 0 : Infinity,
            ease: "easeInOut",
          }}
          className={`absolute left-0 top-0 bottom-0 w-px ${
            stopped ? "bg-sky-400" : "bg-cyan-400"
          }`}
        />

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <motion.span
              animate={
                stopped
                  ? { opacity: 0.45 }
                  : {
                      opacity: [0.45, 1, 0.45],
                      scale: [1, 1.12, 1],
                    }
              }
              transition={{
                duration: 1.8,
                repeat: stopped ? 0 : Infinity,
                ease: "easeInOut",
              }}
              className={`h-2 w-2 shrink-0 rounded-full ${
                isRoot
                  ? "bg-cyan-300"
                  : stopped
                    ? "bg-sky-400"
                    : "bg-cyan-400"
              }`}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-mono text-[11px] text-neutral-200">
                  {node.name}
                </span>

                {isRoot && (
                  <span className="rounded border border-cyan-500/20 bg-cyan-500/5 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em] text-cyan-400">
                    ROOT
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.14em] text-neutral-600">
                <span>PID {node.pid}</span>
                <span>PPID {node.ppid}</span>
                <span>{stopped ? "SUSPENDED" : "RUNNING"}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-mono text-sm text-neutral-200">
              {animatedCpu.toFixed(1)}%
            </div>

            <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.16em] text-neutral-600">
              CPU
            </div>
          </div>
        </div>

        {/* CPU activity trace */}
        <div className="mt-3 h-px overflow-hidden bg-neutral-800">
          <motion.div
            animate={{
              width: `${cpuWidth}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 110,
              damping: 22,
            }}
            className={`h-full ${
              stopped ? "bg-sky-400/60" : "bg-cyan-400/70"
            }`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProcessTopology({ process, selected }) {
  const tree = Array.isArray(process.tree) ? process.tree : [];

  if (tree.length <= 1) {
    return null;
  }

  const byParent = new Map();

  for (const node of tree) {
    if (!byParent.has(node.ppid)) {
      byParent.set(node.ppid, []);
    }

    byParent.get(node.ppid).push(node);
  }

  const root =
    tree.find(
      (node) => !tree.some((item) => item.pid === node.ppid),
    ) ?? tree[0];

  const nodes = [];

  function walk(node, depth = 0) {
    if (!node) return;

    nodes.push({
      ...node,
      depth,
      isRoot: depth === 0,
    });

    const children = byParent.get(node.pid) ?? [];

    for (const child of children) {
      walk(child, depth + 1);
    }
  }

  walk(root);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative mt-4 overflow-hidden rounded-2xl bg-neutral-950/50 transition-colors duration-300 ${
        selected
          ? "border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.05)]"
          : "border border-neutral-800/80"
      }`}
    >
      {/* topology header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 px-4 py-3">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-neutral-600">
            Execution Graph
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-300">
              Process Topology
            </span>

            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-cyan-400">
              LIVE
            </span>

            {selected && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-cyan-300"
              >
                FOCUSED
              </motion.span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-sm text-neutral-200">
            {tree.length}
          </div>

          <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-neutral-600">
            NODES
          </div>
        </div>
      </div>

      {/* topology body */}
      <div className="relative p-4">
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {nodes.map((node) => (
              <TopologyNode
                key={node.pid}
                node={node}
                depth={node.depth}
                isRoot={node.isRoot}
              />
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* bottom status strip */}
      <div className="flex items-center justify-between border-t border-neutral-800/60 px-4 py-2">
        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-700">
          Parent / Child Relationship Map
        </span>

        <motion.span
          animate={{ opacity: [0.35, 0.8, 0.35] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="font-mono text-[7px] uppercase tracking-[0.18em] text-cyan-500/70"
        >
          STREAMING
        </motion.span>
      </div>
    </motion.div>
  );
}

function CommandCentre({
  status,
  cpu,
  memory,
  power,
  processCount,
}) {
  const statusMap = {
    OPTIMAL: {
      label: "SYSTEM NOMINAL",
      text: "text-emerald-300",
      border: "border-emerald-500/20",
      ring: "stroke-emerald-400",
      glow: "shadow-[0_0_40px_rgba(52,211,153,0.08)]",
      value: "text-emerald-300",
    },
    WARNING: {
      label: "SYSTEM DEGRADED",
      text: "text-amber-300",
      border: "border-amber-500/20",
      ring: "stroke-amber-400",
      glow: "shadow-[0_0_40px_rgba(245,158,11,0.10)]",
      value: "text-amber-300",
    },
    CRITICAL: {
      label: "SYSTEM CRITICAL",
      text: "text-red-400",
      border: "border-red-500/20",
      ring: "stroke-red-400",
      glow: "shadow-[0_0_45px_rgba(239,68,68,0.12)]",
      value: "text-red-400",
    },
  };

  const theme = statusMap[status] ?? statusMap.OPTIMAL;

  const load = clamp(cpu);
  const circumference = 2 * Math.PI * 92;
  const dashOffset =
    circumference - (load / 100) * circumference;

  return (
    <motion.section
      layout
      className={`relative overflow-hidden rounded-3xl border bg-neutral-950/85 ${theme.border} ${theme.glow}`}
    >
      {/* ambient signal field */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          opacity: status === "CRITICAL" ? [0.2, 0.5, 0.2] : 0.18,
        }}
        transition={{
          duration: 1.8,
          repeat: status === "CRITICAL" ? Infinity : 0,
          ease: "easeInOut",
        }}
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(34,211,238,0.08), transparent 40%)",
        }}
      />

      {/* top telemetry strip */}
      <div className="relative flex items-center justify-between border-b border-neutral-800/80 px-5 py-3">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-1.5 w-1.5 rounded-full bg-cyan-400"
          />

          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-500">
            NEXUS CORE
          </span>

          <span className="text-neutral-800">/</span>

          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/70">
            LIVE CONTROL
          </span>
        </div>

        <span className={`font-mono text-[8px] uppercase tracking-[0.18em] ${theme.text}`}>
          {theme.label}
        </span>
      </div>

      <div className="relative grid min-h-[520px] lg:grid-cols-[1fr_1.15fr_1fr]">
        {/* left metrics */}
        <div className="flex flex-col justify-center border-b border-neutral-900 p-6 lg:border-b-0 lg:border-r">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-700">
            RESOURCE LOAD
          </div>

          <div className="mt-5 space-y-4">
            {[
              ["CPU", cpu, "%", 100],
              ["MEMORY", memory, "%", 100],
              ["POWER", power, "W", 95],
            ].map(([label, value, suffix, max]) => (
              <div key={label}>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-600">
                    {label}
                  </span>

                  <span className="font-mono text-xs text-neutral-300">
                    {Number(value).toFixed(1)}
                    <span className="ml-1 text-[8px] text-neutral-700">
                      {suffix}
                    </span>
                  </span>
                </div>

                <div className="mt-2 h-px overflow-hidden bg-neutral-900">
                  <motion.div
                    animate={{
                      width: `${clamp((Number(value) / max) * 100)}%`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 22,
                    }}
                    className="h-full bg-cyan-400/60"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* centre system core */}
        <div className="relative flex items-center justify-center p-8">
          <div className="relative h-[250px] w-[250px]">
            {/* outer signal ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0"
            >
              <div className="absolute left-1/2 top-0 h-1 w-8 -translate-x-1/2 rounded-full bg-cyan-400/60" />
            </motion.div>

            {/* svg ring */}
            <svg
              viewBox="0 0 220 220"
              className="absolute inset-0 h-full w-full -rotate-90"
            >
              <circle
                cx="110"
                cy="110"
                r="92"
                fill="none"
                stroke="rgba(255,255,255,0.035)"
                strokeWidth="1"
              />

              <motion.circle
                cx="110"
                cy="110"
                r="92"
                fill="none"
                className={theme.ring}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{
                  strokeDashoffset: dashOffset,
                }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                }}
              />
            </svg>

            {/* inner rings */}
            <motion.div
              animate={{
                scale: status === "CRITICAL" ? [1, 1.04, 1] : 1,
              }}
              transition={{
                duration: 1.4,
                repeat: status === "CRITICAL" ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="absolute inset-[32px] rounded-full border border-neutral-800/80"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-neutral-700">
                SYSTEM LOAD
              </div>

              <div className={`mt-2 font-mono text-5xl font-medium tracking-[-0.05em] ${theme.value}`}>
                {Number(cpu).toFixed(1)}
                <span className="ml-1 text-sm text-neutral-600">
                  %
                </span>
              </div>

              <div className={`mt-3 font-mono text-[8px] uppercase tracking-[0.18em] ${theme.text}`}>
                {status}
              </div>
            </div>

            {/* orbiting marker */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-[14px]"
            >
              <div className="absolute right-2 top-1/2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
            </motion.div>
          </div>
        </div>

        {/* right system info */}
        <div className="flex flex-col justify-center border-t border-neutral-900 p-6 lg:border-l lg:border-t-0">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-neutral-700">
            RUNTIME STATUS
          </div>

          <div className="mt-5 space-y-3">
            {[
              ["PROCESSES", String(processCount).padStart(2, "0")],
              ["MEMORY", `${Number(memory).toFixed(1)}%`],
              ["POWER", `${Number(power).toFixed(1)} W`],
              ["LINK", "WEBSOCKET"],
            ].map(([label, value]) => (
              <motion.div
                layout
                key={label}
                className="flex items-center justify-between border-b border-neutral-900 pb-3"
              >
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-700">
                  {label}
                </span>

                <span className="font-mono text-[10px] text-neutral-300">
                  {value}
                </span>
              </motion.div>
            ))}
          </div>

          <div className={`mt-6 rounded-xl border px-4 py-3 ${theme.border}`}>
            <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-700">
              CONTROL PLANE
            </div>

            <div className={`mt-2 font-mono text-sm ${theme.text}`}>
              {status === "OPTIMAL"
                ? "NOMINAL"
                : status === "WARNING"
                  ? "ATTENTION REQUIRED"
                  : "INTERVENTION REQUIRED"}
            </div>
          </div>
        </div>
      </div>

      {/* footer telemetry */}
      <div className="relative flex items-center justify-between border-t border-neutral-800/80 px-5 py-2.5">
        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-700">
          REAL-TIME SYSTEM TELEMETRY
        </span>

        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-cyan-500/60">
          1 SEC STREAM
        </span>
      </div>
    </motion.section>
  );
}

export default function Home() {
  const [data, setData] = useState(EMPTY_DATA);
  const [connected, setConnected] = useState(false);
  const [actionState, setActionState] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [lastSync, setLastSync] = useState("--:--:--");
  const [reconnectCount, setReconnectCount] = useState(0);
  const [selectedPid, setSelectedPid] = useState(null);
  const [eventFilter, setEventFilter] = useState("ALL");
  const [telemetryHistory, setTelemetryHistory] = useState({
    cpu: [],
    memory: [],
    power: [],
  });

  const reconnectTimer = useRef(null);

  useEffect(() => {
    let socket = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        setConnected(true);
        setReconnectCount(0);
      };

      socket.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data);

          setTelemetryHistory((prev) => ({
            cpu: [...prev.cpu, Number(incoming.system?.cpu ?? 0)].slice(-30),
            memory: [
              ...prev.memory,
              Number(incoming.system?.memory ?? 0),
            ].slice(-30),
            power: [
              ...prev.power,
              Number(incoming.system?.power_watts ?? 0),
            ].slice(-30),
          }));

          setData({
            system: {
              cpu: Number(incoming.system?.cpu ?? 0),
              memory: Number(incoming.system?.memory ?? 0),
              power_watts: Number(
                incoming.system?.power_watts ?? 0,
              ),
            },
            processes: Array.isArray(incoming.processes)
              ? incoming.processes
              : [],
            events: Array.isArray(incoming.events)
              ? incoming.events.slice(-20)
              : [],
            nexus_status: incoming.nexus_status ?? "OPTIMAL",
          });

          setLastSync(
            new Date().toLocaleTimeString("en-GB", {
              hour12: false,
            }),
          );
        } catch (error) {
          console.error("NEXUS telemetry error:", error);
        }
      };

      socket.onerror = () => {
        setConnected(false);
      };

      socket.onclose = () => {
        setConnected(false);

        if (disposed) return;

        setReconnectCount((value) => value + 1);

        reconnectTimer.current = setTimeout(connect, 2500);
      };
    };

    connect();

    return () => {
      disposed = true;

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      socket?.close();
    };
  }, []);

  async function executeAction(pid, action) {
    const key = `${pid}-${action}`;

    try {
      setActionState(key);
      setActionMessage(null);

      const response = await fetch(
        `${API_BASE}/api/process/${pid}/${action}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const labels = {
        freeze: "FREEZE",
        resume: "RESUME",
        kill: "TERMINATE",
      };

      setActionMessage(
        `${labels[action]} request accepted · PID ${pid}`,
      );
    } catch (error) {
      console.error("NEXUS action error:", error);

      setActionMessage(
        `Request failed · PID ${pid} · backend unavailable`,
      );
    } finally {
      setActionState(null);
    }
  }

  const systemStatus = statusConfig(data.nexus_status);

  const criticalCount = useMemo(
    () =>
      data.processes.filter(
        (process) => Number(process.threat_score) >= 80,
      ).length,
    [data.processes],
  );

  const eventStats = useMemo(() => {
    const stats = {
      ALL: data.events.length,
      CRITICAL: 0,
      WARNING: 0,
      INFO: 0,
    };

    for (const event of data.events) {
      const severity = String(event.severity).toUpperCase();

      if (severity === "CRITICAL") {
        stats.CRITICAL += 1;
      } else if (severity === "WARNING") {
        stats.WARNING += 1;
      } else {
        stats.INFO += 1;
      }
    }

    return stats;
  }, [data.events]);

  const visibleEvents = useMemo(() => {
    return [...data.events]
      .slice(-20)
      .reverse()
      .filter((event) => {
        if (eventFilter === "ALL") return true;

        return (
          String(event.severity).toUpperCase() === eventFilter
        );
      });
  }, [data.events, eventFilter]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      {/* background grid */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.018]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* runtime ambience */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        animate={{
          opacity: data.nexus_status === "WARNING" ? 1 : 0,
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle at 50% -10%, rgba(245,158,11,0.10), transparent 48%)",
        }}
      />

      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        animate={{
          opacity: data.nexus_status === "CRITICAL" ? 1 : 0,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle at 50% -10%, rgba(239,68,68,0.13), transparent 52%)",
        }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between px-5 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/5">
              <Shield className="h-4 w-4 text-cyan-300" />
            </div>

            <div className="font-mono text-xs tracking-[0.18em]">
              <span className="text-white">NEXUS</span>
              <span className="text-neutral-700"> / </span>
              <span className="text-cyan-300">RUNTIME CONTROL PLANE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 font-mono text-[8px] uppercase tracking-[0.15em] text-neutral-600 sm:flex">
              LAST SYNC
              <span className="text-neutral-400">{lastSync}</span>
            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] ${
                connected
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  : "border-red-500/20 bg-red-500/5 text-red-400"
              }`}
            >
              {connected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}

              {connected
                ? "CONNECTED"
                : `RECONNECT ${reconnectCount}`}
            </div>

            <motion.div
              animate={{
                scale: data.nexus_status === "CRITICAL" ? [1, 1.015, 1] : 1,
              }}
              transition={{
                duration: 1.4,
                repeat: data.nexus_status === "CRITICAL" ? Infinity : 0,
                ease: "easeInOut",
              }}
              className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] ${systemStatus.bg} ${systemStatus.border} ${systemStatus.text}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${systemStatus.dot} ${systemStatus.glow} ${
                  data.nexus_status === "CRITICAL"
                    ? "animate-pulse"
                    : ""
                }`}
              />
              {systemStatus.label}
            </motion.div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1700px] px-5 py-7 lg:px-8">
        {/* COMMAND CENTRE */}
        <section>
          <CommandCentre
            status={data.nexus_status}
            cpu={data.system.cpu}
            memory={data.system.memory}
            power={data.system.power_watts}
            processCount={data.processes.length}
          />
        </section>

        {/* TELEMETRY */}
        <section
          id="telemetry"
          className="scroll-mt-20 border-b border-neutral-900 py-9"
        >
          <SectionHeader
            index="01"
            label="SYSTEM TELEMETRY"
            icon={<Activity className="h-3.5 w-3.5" />}
          />

          <div className="grid gap-3 lg:grid-cols-3">
            <MetricCard
              label="CPU"
              percent={data.system.cpu}
              hot={data.system.cpu > 80}
              suffix="%"
              icon={<Cpu className="h-3.5 w-3.5" />}
            />

            <MetricCard
              label="MEMORY"
              percent={data.system.memory}
              hot={data.system.memory > 80}
              suffix="%"
              icon={<HardDrive className="h-3.5 w-3.5" />}
            />

            <MetricCard
              label="POWER"
              percent={data.system.power_watts}
              hot={data.system.power_watts > 85}
              suffix=" W"
              icon={<Power className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <TelemetryTrace
              label="CPU LOAD"
              value={data.system.cpu}
              suffix="%"
              samples={telemetryHistory.cpu}
              maxValue={100}
            />

            <TelemetryTrace
              label="MEMORY LOAD"
              value={data.system.memory}
              suffix="%"
              samples={telemetryHistory.memory}
              maxValue={100}
            />

            <TelemetryTrace
              label="POWER DRAW"
              value={data.system.power_watts}
              suffix=" W"
              samples={telemetryHistory.power}
              maxValue={95}
            />
          </div>
        </section>

        {/* PROCESS EXPLORER */}
        <section className="border-b border-neutral-900 py-9">
          <SectionHeader
            index="02"
            label="PROCESS MONITOR"
            icon={<Shield className="h-3.5 w-3.5" />}
          />

          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/80">
            <div className="hidden grid-cols-[72px_minmax(170px,1.5fr)_90px_200px_105px_minmax(280px,.9fr)] border-b border-neutral-800 bg-neutral-900/30 px-4 py-2.5 font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-700 md:grid">
              <span>PID</span>
              <span>PROCESS</span>
              <span>CPU</span>
              <span>THREAT</span>
              <span>STATE</span>
              <span>CONTROL</span>
            </div>

            {data.processes.length === 0 ? (
              <div className="flex min-h-[230px] items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400/70" />

                  <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                    No active process telemetry
                  </div>

                  <div className="mt-1 text-xs text-neutral-800">
                    Waiting for runtime data.
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false} mode="sync">
                {data.processes.map((process) => (
                  <ProcessRow
                    key={process.pid}
                    process={process}
                    actionState={actionState}
                    executeAction={executeAction}
                    selected={selectedPid === process.pid}
                    onSelect={() => setSelectedPid(process.pid)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {data.processes
            .filter(
              (process) =>
                Array.isArray(process.tree) &&
                process.tree.length > 1
            )
            .map((process) => (
              <ProcessTopology
                key={`topology-${process.pid}`}
                process={process}
                selected={selectedPid === process.pid}
              />
            ))}

          <AnimatePresence initial={false} mode="wait">
            {actionMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 26,
                }}
                className="mt-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-neutral-700"
              >
                <Circle className="h-2.5 w-2.5 fill-cyan-400 text-cyan-400" />
                {actionMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* EVENTS + STATE */}
        <section className="py-9">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
            <div>
              <SectionHeader
                index="03"
                label="RUNTIME EVENTS"
                icon={<Radio className="h-3.5 w-3.5" />}
              />

              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/80">
                {/* event header */}
                <div className="border-b border-neutral-800 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-600">
                      Event Intelligence
                    </span>

                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [0.35, 0.8, 0.35] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                      />

                      <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-cyan-500/70">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* severity counters */}
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {["ALL", "CRITICAL", "WARNING", "INFO"].map((filter) => {
                      const active = eventFilter === filter;

                      const count =
                        filter === "ALL"
                          ? eventStats.ALL
                          : eventStats[filter];

                      return (
                        <motion.button
                          key={filter}
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setEventFilter(filter)}
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            active
                              ? filter === "CRITICAL"
                                ? "border-red-500/30 bg-red-500/[0.06]"
                                : filter === "WARNING"
                                  ? "border-amber-500/30 bg-amber-500/[0.06]"
                                  : filter === "INFO"
                                    ? "border-neutral-700 bg-neutral-900/70"
                                    : "border-cyan-500/25 bg-cyan-500/[0.05]"
                              : "border-neutral-900 bg-neutral-950/60 hover:border-neutral-800"
                          }`}
                        >
                          <div
                            className={`font-mono text-[7px] uppercase tracking-[0.16em] ${
                              filter === "CRITICAL"
                                ? "text-red-400"
                                : filter === "WARNING"
                                  ? "text-amber-300"
                                  : filter === "INFO"
                                    ? "text-neutral-500"
                                    : "text-neutral-600"
                            }`}
                          >
                            {filter}
                          </div>

                          <div
                            className={`mt-1 font-mono text-sm ${
                              active
                                ? filter === "CRITICAL"
                                  ? "text-red-300"
                                  : filter === "WARNING"
                                    ? "text-amber-200"
                                    : "text-neutral-200"
                                : "text-neutral-500"
                            }`}
                          >
                            {String(count).padStart(2, "0")}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* filtered event stream */}
                <div className="max-h-[420px] overflow-y-auto">
                  {visibleEvents.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center">
                      <div className="text-center">
                        <Radio className="mx-auto h-5 w-5 text-neutral-800" />

                        <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-700">
                          No matching events
                        </div>

                        <div className="mt-1 text-xs text-neutral-800">
                          Filter returned an empty stream.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                      {visibleEvents.map((event, index) => {
                        const severity = severityConfig(event.severity);

                        return (
                          <motion.div
                            key={`${event.time}-${event.message}`}
                            layout
                            initial={{
                              opacity: 0,
                              y: -14,
                              filter: "blur(4px)",
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              filter: "blur(0px)",
                            }}
                            exit={{
                              opacity: 0,
                              x: -12,
                              filter: "blur(3px)",
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 360,
                              damping: 30,
                            }}
                            className={`border-b px-4 py-3.5 last:border-b-0 ${severity.border} ${severity.bg}`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                  severity.dot
                                } ${index === 0 ? "animate-pulse" : ""}`}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-[8px] text-neutral-700">
                                    {event.time}
                                  </span>

                                  <span
                                    className={`font-mono text-[8px] uppercase tracking-[0.15em] ${severity.text}`}
                                  >
                                    {event.severity}
                                  </span>
                                </div>

                                <div className="mt-1.5 font-mono text-[11px] leading-5 text-neutral-400">
                                  {event.message}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>

            <div>
              <SectionHeader
                index="04"
                label="RUNTIME STATE"
                icon={<Server className="h-3.5 w-3.5" />}
              />

              <div className="space-y-2">
                <StateRow
                  label="WEBSOCKET"
                  value={connected ? "CONNECTED" : "OFFLINE"}
                  ok={connected}
                  icon={
                    connected ? (
                      <Wifi className="h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" />
                    )
                  }
                />

                <StateRow
                  label="SENTINEL"
                  value={
                    criticalCount > 0
                      ? `${criticalCount} CRITICAL`
                      : "NOMINAL"
                  }
                  ok={criticalCount === 0}
                  critical={criticalCount > 0}
                  icon={<Shield className="h-3.5 w-3.5" />}
                />

                <StateRow
                  label="RUNTIME"
                  value={data.nexus_status}
                  ok={data.nexus_status === "OPTIMAL"}
                  warning={data.nexus_status === "WARNING"}
                  critical={data.nexus_status === "CRITICAL"}
                  icon={<Activity className="h-3.5 w-3.5" />}
                />

                <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4">
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-700">
                    CONTROL API
                  </div>

                  <div className="mt-3 space-y-2 font-mono text-[9px]">
                    <ApiLine label="FREEZE" />
                    <ApiLine label="RESUME" />
                    <ApiLine label="TERMINATE" danger />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-neutral-900 py-6">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-700">
              NEXUS // RUNTIME CONTROL PLANE
            </div>

            <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-800">
              LOCAL INSTANCE
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function OverviewValue({
  label,
  value,
  icon,
  critical = false,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3">
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-700">
          {label}
        </div>

        <div
          className={`mt-1 font-mono text-xl ${
            critical ? "text-red-400" : "text-neutral-200"
          }`}
        >
          {value}
        </div>
      </div>

      <div className={critical ? "text-red-400" : "text-cyan-300"}>
        {icon}
      </div>
    </div>
  );
}

function StateRow({
  label,
  value,
  icon,
  ok = false,
  warning = false,
  critical = false,
}) {
  const color = critical
    ? "text-red-400"
    : warning
      ? "text-amber-300"
      : ok
        ? "text-emerald-300"
        : "text-neutral-500";

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="text-neutral-700">{icon}</div>

        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-600">
          {label}
        </span>
      </div>

      <div className={`font-mono text-[9px] ${color}`}>
        {value}
      </div>
    </div>
  );
}

function ApiLine({ label, danger = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-600">POST</span>

      <span
        className={
          danger
            ? "text-red-400/70"
            : "text-neutral-500"
        }
      >
        /api/process/:pid/{label.toLowerCase()}
      </span>

      <span className="text-emerald-400">READY</span>
    </div>
  );
}