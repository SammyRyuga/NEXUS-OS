#!/usr/bin/env python3
"""
nexus_engine.py
===============

NEXUS OS — adaptive operating environment telemetry engine.

Responsibilities
----------------
* Sample real system + per-process telemetry via psutil once per second.
* Model power draw as a function of CPU load (idle ~15W -> ~95W saturated).
* Score threat for the tracked workload, with decay and a hard drop when the
  process is suspended.
* Maintain a rolling 20-entry event timeline.
* Broadcast the full world state to every connected WebSocket client on /ws.
* Expose REST control endpoints that deliver real OS signals to a PID.

Run:
    uvicorn nexus_engine:app --host 0.0.0.0 --port 8000
    # or simply: python nexus_engine.py

Dependencies:
    pip install fastapi "uvicorn[standard]" psutil
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import signal
import time
from collections import deque
from datetime import datetime
from typing import Any, Deque, Dict, List, Optional, Set

import psutil
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

TARGET_PROCESS_NAME = "malicious_workload.py"

TICK_SECONDS = 1.0            # telemetry cadence (contract: 1 Hz)
EVENT_LOG_SIZE = 20           # contract: keep the last 20 events
PROCESS_TABLE_SIZE = 8        # how many rows the UI table gets

IDLE_WATTS = 15.0             # power floor
PEAK_WATTS = 95.0             # power ceiling at 100% CPU
POWER_CURVE_EXP = 1.15        # slightly super-linear: idle cores are cheap

THREAT_HOT_CPU = 80.0         # "hot" threshold from the spec
THREAT_WARM_CPU = 40.0
THREAT_GAIN_HOT = 14.0        # points/tick while hot
THREAT_GAIN_WARM = 5.0
THREAT_DECAY = 6.0            # points/tick while quiet
THREAT_SUSPENDED_FLOOR = 0.60 # multiplier applied each tick while SIGSTOPped
THREAT_SUSPENDED_DROP = 12.0  # flat drop each tick while SIGSTOPped

STATUS_WARNING_CPU = 70.0
STATUS_CRITICAL_CPU = 90.0
STATUS_WARNING_THREAT = 40.0
STATUS_CRITICAL_THREAT = 75.0

EVENT_COOLDOWN_SECONDS = 6.0  # per-event-key anti-spam window

# PIDs the engine refuses to signal, no matter what the UI asks.
PROTECTED_PIDS = {0, 1, os.getpid()}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("nexus")

CPU_COUNT = psutil.cpu_count(logical=True) or 1

# Signals may not exist on Windows; resolve them once and fall back to psutil.
SIG_STOP = getattr(signal, "SIGSTOP", None)
SIG_CONT = getattr(signal, "SIGCONT", None)
SIG_KILL = getattr(signal, "SIGKILL", signal.SIGTERM)


# --------------------------------------------------------------------------- #
# State
# --------------------------------------------------------------------------- #

class NexusState:
    """Single source of truth for the broadcast payload.

    Mutated only by the sampler loop and the control endpoints, both of which
    run on the event loop thread, so an asyncio.Lock is sufficient.
    """

    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self.system: Dict[str, float] = {"cpu": 0.0, "memory": 0.0, "power_watts": IDLE_WATTS}
        self.processes: List[Dict[str, Any]] = []
        self.events: Deque[Dict[str, str]] = deque(maxlen=EVENT_LOG_SIZE)
        self.nexus_status: str = "OPTIMAL"

        # Internal bookkeeping — never serialised.
        self._threat_scores: Dict[int, float] = {}
        self._event_cooldowns: Dict[str, float] = {}

    # -- events ------------------------------------------------------------ #

    def log_event(self, message: str, severity: str = "INFO",
                  key: Optional[str] = None, cooldown: float = EVENT_COOLDOWN_SECONDS) -> bool:
        """Append an event. Returns False if suppressed by its cooldown key."""
        now = time.monotonic()
        if key is not None:
            last = self._event_cooldowns.get(key, 0.0)
            if now - last < cooldown:
                return False
            self._event_cooldowns[key] = now

        self.events.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "message": message,
            "severity": severity,
        })
        log.info("[%s] %s", severity, message)
        return True

    # -- threat model ------------------------------------------------------ #

    def update_threat(self, pid: int, cpu_percent: float, status: str) -> int:
        """Advance the threat score for a PID by one tick and return it (0-100)."""
        score = self._threat_scores.get(pid, 0.0)

        if status == psutil.STATUS_STOPPED:
            # Frozen by the operator: collapse the score fast, that's the payoff
            # of the freeze button.
            score = max(0.0, score * THREAT_SUSPENDED_FLOOR - THREAT_SUSPENDED_DROP)
        elif cpu_percent >= THREAT_HOT_CPU:
            score += THREAT_GAIN_HOT
        elif cpu_percent >= THREAT_WARM_CPU:
            score += THREAT_GAIN_WARM
        else:
            score -= THREAT_DECAY

        score = max(0.0, min(100.0, score))
        self._threat_scores[pid] = score
        return int(round(score))

    def forget(self, pid: int) -> None:
        self._threat_scores.pop(pid, None)

    def prune(self, live_pids: Set[int]) -> None:
        for pid in list(self._threat_scores):
            if pid not in live_pids:
                self._threat_scores.pop(pid, None)

    # -- serialisation ----------------------------------------------------- #

    def snapshot(self) -> Dict[str, Any]:
        """Exact wire contract. Key names and types must not drift."""
        return {
            "system": {
                "cpu": round(self.system["cpu"], 1),
                "memory": round(self.system["memory"], 1),
                "power_watts": round(self.system["power_watts"], 1),
            },
            "processes": self.processes,
            "events": list(self.events),
            "nexus_status": self.nexus_status,
        }


state = NexusState()


# --------------------------------------------------------------------------- #
# Connection manager
# --------------------------------------------------------------------------- #

class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        log.info("client connected (%d active)", len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        log.info("client disconnected (%d active)", len(self._connections))

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        async with self._lock:
            targets = list(self._connections)
        if not targets:
            return

        dead: List[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)


manager = ConnectionManager()


# --------------------------------------------------------------------------- #
# Telemetry helpers
# --------------------------------------------------------------------------- #

def compute_power_watts(cpu_percent: float) -> float:
    """Map CPU utilisation onto a plausible package power curve."""
    load = max(0.0, min(100.0, cpu_percent)) / 100.0
    return IDLE_WATTS + (PEAK_WATTS - IDLE_WATTS) * (load ** POWER_CURVE_EXP)


def is_target_process(proc_info: Dict[str, Any]) -> bool:
    """Match the workload by cmdline, since its process name is 'python'."""
    name = (proc_info.get("name") or "").lower()
    if TARGET_PROCESS_NAME.lower() in name:
        return True
    cmdline = proc_info.get("cmdline") or []
    return any(TARGET_PROCESS_NAME.lower() in str(arg).lower() for arg in cmdline)


def process_cpu_percent(raw: float) -> float:
    """Display-clamped process CPU, on the intuitive '100% = one full core'
    scale rather than normalised against total machine capacity. A process
    saturating one logical core reads ~100 here, which is what the threat
    model and the UI gauge both expect. Multi-core workloads are clamped to
    100 for display; the unclamped raw value is kept separately for
    scoring, since a multi-threaded burner legitimately exceeds 100%."""
    return round(max(0.0, min(100.0, raw or 0.0)), 1)


def prime_process_counters() -> None:
    """First call to cpu_percent() per process always returns 0.0 — burn it."""
    for proc in psutil.process_iter(["pid"]):
        with contextlib.suppress(psutil.Error):
            proc.cpu_percent(interval=None)
    psutil.cpu_percent(interval=None)


def collect_processes() -> tuple[List[Dict[str, Any]], Set[int], List[Dict[str, Any]]]:
    """Return (rows, live_pids, workload_root_rows) for this tick."""
    attrs = ["pid", "ppid", "name", "status", "cmdline"]
    snapshot: Dict[int, Dict[str, Any]] = {}
    children_of: Dict[Optional[int], List[int]] = {}
    live_pids: Set[int] = set()

    for proc in psutil.process_iter(attrs):
        try:
            info = proc.info
            pid = info["pid"]

            if pid == 0 or (info.get("name") or "").lower() == "system idle process":
                continue

            raw_cpu = proc.cpu_percent(interval=None)
            ppid = info.get("ppid")

            snapshot[pid] = {
                "pid": pid,
                "ppid": ppid,
                "name": info.get("name") or f"pid-{pid}",
                "status": info.get("status") or psutil.STATUS_RUNNING,
                "raw_cpu": raw_cpu,
                "is_target": is_target_process(info),
            }
            live_pids.add(pid)
            children_of.setdefault(ppid, []).append(pid)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    def subtree_cpu(root_pid: int, seen: Set[int]) -> float:
        """Sum raw CPU across root_pid and every live descendant, once each."""
        if root_pid in seen or root_pid not in snapshot:
            return 0.0
        seen.add(root_pid)
        total = snapshot[root_pid]["raw_cpu"]
        for child_pid in children_of.get(root_pid, []):
            total += subtree_cpu(child_pid, seen)
        return total

    def subtree_nodes(root_pid: int, seen: Set[int]) -> List[Dict[str, Any]]:
        """Return the live process hierarchy beneath root_pid."""
        if root_pid in seen or root_pid not in snapshot:
            return []

        seen.add(root_pid)
        node = snapshot[root_pid]

        result = [{
            "pid": node["pid"],
            "ppid": node["ppid"],
            "name": node["name"],
            "status": node["status"],
            "cpu": process_cpu_percent(node["raw_cpu"]),
            "target": node["is_target"],
        }]

        for child_pid in children_of.get(root_pid, []):
            result.extend(subtree_nodes(child_pid, seen))

        return result

    rows: List[Dict[str, Any]] = []
    root_targets: List[Dict[str, Any]] = []

    # Every PID that lives beneath a target (root or nested) belongs to the
    # workload's topology view only — it must never also appear as its own
    # row in the flat process table below, even when it isn't itself flagged
    # as a target (e.g. a plain "python.exe" burner child spawned by the
    # tracked workload).
    target_descendants: Set[int] = set()
    for target in snapshot.values():
        if not target["is_target"]:
            continue
        target_descendants.update(
            node["pid"]
            for node in subtree_nodes(target["pid"], set())
            if node["pid"] != target["pid"]
        )

    for pid, info in snapshot.items():
        if not info["is_target"]:
            continue
        parent = info["ppid"]
        parent_is_target = parent in snapshot and snapshot[parent]["is_target"]
        if parent_is_target:
            continue

        aggregate_cpu = subtree_cpu(pid, set())
        row = {
            "pid": pid,
            "name": TARGET_PROCESS_NAME,
            "cpu": process_cpu_percent(aggregate_cpu),
            "status": info["status"],
            "threat_score": 0,
            "tree": subtree_nodes(pid, set()),
            "_raw_cpu": aggregate_cpu,
            "_is_target": True,
        }
        rows.append(row)
        root_targets.append(row)

    for pid, info in snapshot.items():
        if info["is_target"] or pid in target_descendants:
            continue  # already represented via its workload root above
        rows.append({
            "pid": pid,
            "name": info["name"],
            "cpu": process_cpu_percent(info["raw_cpu"]),
            "status": info["status"],
            "threat_score": 0,
            "_raw_cpu": info["raw_cpu"],
            "_is_target": False,
        })

    return rows, live_pids, root_targets


def derive_status(system_cpu: float, max_threat: int) -> str:
    if system_cpu >= STATUS_CRITICAL_CPU or max_threat >= STATUS_CRITICAL_THREAT:
        return "CRITICAL"
    if system_cpu >= STATUS_WARNING_CPU or max_threat >= STATUS_WARNING_THREAT:
        return "WARNING"
    return "OPTIMAL"


# --------------------------------------------------------------------------- #
# Sentinel loop
# --------------------------------------------------------------------------- #

async def sentinel_loop() -> None:
    """Sample, score, log, broadcast — once per TICK_SECONDS, forever."""
    await asyncio.to_thread(prime_process_counters)
    log.info("sentinel online — tracking '%s' across %d logical cores",
             TARGET_PROCESS_NAME, CPU_COUNT)

    known_targets: Set[int] = set()
    threat_states: Dict[int, str] = {}

    while True:
        tick_started = time.monotonic()
        try:
            system_cpu = await asyncio.to_thread(psutil.cpu_percent, None)
            memory = psutil.virtual_memory().percent
            rows, live_pids, targets = await asyncio.to_thread(collect_processes)

            async with state.lock:
                state.prune(live_pids)

                # --- threat scoring -------------------------------------- #
                max_threat = 0
                for row in rows:
                    if row["_is_target"]:
                        row["threat_score"] = state.update_threat(
                            row["pid"], row["_raw_cpu"], row["status"]
                        )
                        max_threat = max(max_threat, row["threat_score"])
                    else:
                        state.forget(row["pid"])

                # --- target lifecycle events ------------------------------ #
                current_targets = {row["pid"] for row in targets}
                for pid in current_targets - known_targets:
                    state.log_event(
                        f"Sentinel: new workload '{TARGET_PROCESS_NAME}' detected (PID {pid})",
                        "WARNING", key=f"spawn:{pid}",
                    )
                for pid in known_targets - current_targets:
                    state.log_event(
                        f"Sentinel: workload PID {pid} is no longer running",
                        "INFO", key=f"gone:{pid}",
                    )
                    state.forget(pid)
                    threat_states.pop(pid, None)
                known_targets = current_targets

                # --- anomaly state transitions ----------------------------- #
                current_threat_states: Dict[int, str] = {}

                for row in targets:
                    pid = row["pid"]

                    if row["status"] == psutil.STATUS_STOPPED:
                        level = "SUSPENDED"
                    elif row["threat_score"] >= STATUS_CRITICAL_THREAT:
                        level = "CRITICAL"
                    elif row["cpu"] >= THREAT_HOT_CPU:
                        level = "WARNING"
                    else:
                        level = "NORMAL"

                    previous = threat_states.get(pid)
                    current_threat_states[pid] = level

                    if previous == level:
                        continue

                    if level == "SUSPENDED":
                        state.log_event(
                            f"Sentinel: PID {pid} suspended — threat decay active",
                            "INFO", key=f"state:{pid}:suspended", cooldown=0,
                        )
                    elif level == "CRITICAL":
                        state.log_event(
                            f"Sentinel: PID {pid} entered critical state "
                            f"({row['threat_score']}) — containment advised",
                            "CRITICAL", key=f"state:{pid}:critical", cooldown=0,
                        )
                    elif level == "WARNING":
                        state.log_event(
                            f"Sentinel: CPU anomaly detected on PID {pid} "
                            f"({row['cpu']:.0f}%)",
                            "WARNING", key=f"state:{pid}:warning", cooldown=0,
                        )
                    elif previous in {"WARNING", "CRITICAL", "SUSPENDED"}:
                        state.log_event(
                            f"Sentinel: PID {pid} returned to nominal activity",
                            "INFO", key=f"state:{pid}:normal", cooldown=0,
                        )

                threat_states = current_threat_states

                if system_cpu >= STATUS_CRITICAL_CPU:
                    state.log_event(
                        f"Sentinel: CPU Anomaly detected — host at {system_cpu:.0f}%",
                        "CRITICAL", key="host-cpu",
                    )

                # --- commit state ----------------------------------------- #
                state.system["cpu"] = system_cpu
                state.system["memory"] = memory
                state.system["power_watts"] = compute_power_watts(system_cpu)

                rows.sort(key=lambda r: (r["_is_target"], r["threat_score"], r["cpu"]),
                          reverse=True)
                visible = rows[:PROCESS_TABLE_SIZE]
                state.processes = [
                    {k: v for k, v in row.items() if not k.startswith("_")}
                    for row in visible
                ]

                new_status = derive_status(system_cpu, max_threat)
                if new_status != state.nexus_status:
                    severity = {"OPTIMAL": "INFO", "WARNING": "WARNING",
                                "CRITICAL": "CRITICAL"}[new_status]
                    state.log_event(
                        f"NEXUS state transition: {state.nexus_status} -> {new_status}",
                        severity, key=f"transition:{new_status}", cooldown=3.0,
                    )
                    state.nexus_status = new_status

                payload = state.snapshot()

            await manager.broadcast(payload)

        except asyncio.CancelledError:
            raise
        except Exception:
            log.exception("sentinel tick failed; continuing")

        elapsed = time.monotonic() - tick_started
        await asyncio.sleep(max(0.0, TICK_SECONDS - elapsed))


# --------------------------------------------------------------------------- #
# Application
# --------------------------------------------------------------------------- #

@contextlib.asynccontextmanager
async def lifespan(_app: FastAPI):
    async with state.lock:
        state.log_event("NEXUS OS kernel online — sentinel initialising", "INFO")
    task = asyncio.create_task(sentinel_loop(), name="sentinel")
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task
        log.info("sentinel offline")


app = FastAPI(
    title="NEXUS OS Engine",
    description="Adaptive operating environment telemetry and control plane.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# WebSocket
# --------------------------------------------------------------------------- #

@app.websocket("/ws")
async def telemetry_socket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        # Send an immediate frame so the UI paints without waiting a full tick.
        async with state.lock:
            await websocket.send_json(state.snapshot())

        # The client isn't expected to send anything; this receive exists purely
        # to observe the disconnect.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        log.debug("socket closed unexpectedly", exc_info=True)
    finally:
        await manager.disconnect(websocket)


# --------------------------------------------------------------------------- #
# Control plane
# --------------------------------------------------------------------------- #

def _resolve_process(pid: int) -> psutil.Process:
    if pid in PROTECTED_PIDS:
        raise HTTPException(status_code=403, detail=f"PID {pid} is protected")
    try:
        return psutil.Process(pid)
    except psutil.NoSuchProcess:
        raise HTTPException(status_code=404, detail=f"PID {pid} not found") from None


def _is_target(proc: psutil.Process) -> bool:
    """Same workload match used by telemetry, applied to a live Process."""
    try:
        return is_target_process({"name": proc.name(), "cmdline": proc.cmdline()})
    except psutil.Error:
        return False


def resolve_control_tree(pid: int) -> List[psutil.Process]:
    """Resolve the process(es) a control action should apply to.

    An ordinary process resolves to just itself. A PID belonging to the
    tracked malicious_workload.py workload resolves to its whole tree:
    this walks up to the workload root (in case a non-root PID was somehow
    targeted) and returns the root plus every live descendant, deduplicated
    by PID, so freeze/resume/kill act on the entire workload as one unit.
    Protected PIDs are never included, even if related to a matched tree.
    """
    proc = _resolve_process(pid)

    if not _is_target(proc):
        return [proc]

    root = proc
    try:
        parent = root.parent()
        while parent is not None and _is_target(parent):
            root = parent
            parent = root.parent()
    except psutil.Error:
        pass

    tree: Dict[int, psutil.Process] = {}
    if root.pid not in PROTECTED_PIDS:
        tree[root.pid] = root
    try:
        for child in root.children(recursive=True):
            if child.pid not in PROTECTED_PIDS:
                tree[child.pid] = child
    except psutil.Error:
        pass

    return list(tree.values()) or [proc]


def _apply_to_tree(processes: List[psutil.Process], sig: Optional[int], fallback: str) -> int:
    """Deliver one control action to every process in the tree.

    Returns the number actually affected. A process that has already
    vanished, denies access, or otherwise fails is skipped rather than
    aborting the whole operation — the remaining processes still get
    acted on and the caller reports the real count.
    """
    affected = 0
    for proc in processes:
        if proc.pid in PROTECTED_PIDS:
            continue
        try:
            if sig is not None:
                os.kill(proc.pid, sig)
            else:
                getattr(proc, fallback)()
            affected += 1
        except (psutil.NoSuchProcess, psutil.ZombieProcess, PermissionError, OSError):
            continue
    return affected


async def _record(message: str, severity: str) -> None:
    async with state.lock:
        state.log_event(message, severity, key=None)


@app.post("/api/process/{pid}/freeze")
async def freeze_process(pid: int) -> Dict[str, Any]:
    """SIGSTOP — suspend the process, or the whole workload tree when pid
    belongs to the tracked malicious_workload.py workload."""
    tree = resolve_control_tree(pid)
    root_pid = tree[0].pid
    affected = _apply_to_tree(tree, SIG_STOP, "suspend")
    if affected == 0:
        raise HTTPException(status_code=404,
                             detail=f"PID {pid} vanished before it could be frozen")

    if len(tree) > 1:
        message = (f"Operator: workload PID {root_pid} suspended — "
                   f"process tree frozen ({affected} processes)")
    else:
        message = f"Operator: SIGSTOP delivered to PID {root_pid} — process frozen"
    await _record(message, "WARNING")

    return {"status": "ok", "action": "freeze", "pid": root_pid, "affected_processes": affected}


@app.post("/api/process/{pid}/resume")
async def resume_process(pid: int) -> Dict[str, Any]:
    """SIGCONT — release a previously suspended process, or the whole
    workload tree when pid belongs to the tracked malicious_workload.py
    workload."""
    tree = resolve_control_tree(pid)
    root_pid = tree[0].pid
    affected = _apply_to_tree(tree, SIG_CONT, "resume")
    if affected == 0:
        raise HTTPException(status_code=404,
                             detail=f"PID {pid} vanished before it could be resumed")

    if len(tree) > 1:
        message = (f"Operator: workload PID {root_pid} resumed — "
                   f"process tree restored ({affected} processes)")
    else:
        message = f"Operator: SIGCONT delivered to PID {root_pid} — process resumed"
    await _record(message, "INFO")

    return {"status": "ok", "action": "resume", "pid": root_pid, "affected_processes": affected}


@app.post("/api/process/{pid}/kill")
async def kill_process(pid: int) -> Dict[str, Any]:
    """SIGKILL — unconditional termination of the process, or the whole
    workload tree when pid belongs to the tracked malicious_workload.py
    workload. Descendants are terminated before the root so no CPU-burner
    or I/O child is left orphaned and still running."""
    tree = resolve_control_tree(pid)
    root_pid = tree[0].pid
    ordered = [p for p in tree if p.pid != root_pid] + [p for p in tree if p.pid == root_pid]
    affected = _apply_to_tree(ordered, SIG_KILL, "kill")
    if affected == 0:
        raise HTTPException(status_code=404,
                             detail=f"PID {pid} vanished before it could be terminated")

    async with state.lock:
        for proc in tree:
            state.forget(proc.pid)
        if len(tree) > 1:
            message = (f"Operator: workload PID {root_pid} terminated — "
                       f"process tree removed ({affected} processes)")
        else:
            message = f"Operator: SIGKILL delivered to PID {root_pid} — threat neutralised"
        state.log_event(message, "CRITICAL")

    return {"status": "ok", "action": "kill", "pid": root_pid, "affected_processes": affected}


@app.get("/api/state")
async def current_state() -> Dict[str, Any]:
    """Polling fallback mirroring the WebSocket payload exactly."""
    async with state.lock:
        return state.snapshot()


@app.get("/api/health")
async def health() -> Dict[str, Any]:
    return {"status": "ok", "cores": CPU_COUNT, "tick_seconds": TICK_SECONDS}


if __name__ == "__main__":
    uvicorn.run("nexus_engine:app", host="0.0.0.0", port=8000, reload=False)