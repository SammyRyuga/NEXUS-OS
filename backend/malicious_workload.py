#!/usr/bin/env python3
"""
malicious_workload.py
=====================

Target process for the NEXUS OS sentinel demo.

Lifecycle:
    Phase 1 (0-10s)   : idle / "normal" behaviour. Sleeps quietly so the
                        sentinel can establish a clean baseline.
    Phase 2 (10s -> ) : spawns N CPU-burner threads running unbounded
                        math.factorial loops, plus one I/O-thrash thread
                        that rewrites a temp file as fast as it can.

Nothing here is actually malicious: it is a deterministic load generator
so the monitoring stack has something real to detect, throttle (SIGSTOP)
and terminate (SIGKILL).

Run it with the literal filename so the engine's cmdline matcher sees it:

    python malicious_workload.py
"""

from __future__ import annotations

import math
import os
import signal
import sys
import tempfile
import threading
import time

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

NORMAL_PHASE_SECONDS = 10.0
# One burner per core keeps the box responsive enough to still serve the UI.
# Bump the multiplier if you want a more violent spike for the demo.
CPU_BURNER_THREADS = max(1, (os.cpu_count() or 2) - 1)
FACTORIAL_N = 2000          # big enough to be expensive, small enough to loop hot
IO_PAYLOAD = b"NEXUS" * 2048  # ~10 KB per write
IO_SLEEP = 0.001            # tiny yield so the thread is I/O bound, not CPU bound

_shutdown = threading.Event()


# --------------------------------------------------------------------------- #
# Workers
# --------------------------------------------------------------------------- #

def cpu_burner(worker_id: int) -> None:
    """Unbounded factorial loop. Pure CPU, no allocation ceiling."""
    log(f"cpu-burner-{worker_id} online")
    counter = 0
    while not _shutdown.is_set():
        math.factorial(FACTORIAL_N)
        counter += 1
        # Periodic checkpoint keeps the loop interruptible without costing much.
        if counter % 50 == 0 and _shutdown.is_set():
            break
    log(f"cpu-burner-{worker_id} stopped after {counter} iterations")


def io_thrasher() -> None:
    """Rapid open/write/flush/fsync cycle against a throwaway temp file."""
    fd, path = tempfile.mkstemp(prefix="nexus_workload_", suffix=".tmp")
    os.close(fd)
    log(f"io-thrasher online -> {path}")

    writes = 0
    try:
        while not _shutdown.is_set():
            with open(path, "wb") as handle:
                handle.write(IO_PAYLOAD)
                handle.flush()
                os.fsync(handle.fileno())
            writes += 1
            time.sleep(IO_SLEEP)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
        log(f"io-thrasher stopped after {writes} writes")


# --------------------------------------------------------------------------- #
# Plumbing
# --------------------------------------------------------------------------- #

def log(message: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] [workload pid={os.getpid()}] {message}",
          flush=True)


def handle_termination(signum, _frame) -> None:
    """Graceful exit on SIGTERM/SIGINT. SIGKILL cannot be trapped, by design."""
    log(f"received signal {signum}, shutting down")
    _shutdown.set()


def main() -> int:
    log(f"starting — normal phase for {NORMAL_PHASE_SECONDS:.0f}s")

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, handle_termination)
        except (ValueError, OSError):
            # Not available on every platform / thread context.
            pass

    # ---- Phase 1: look innocent -------------------------------------------
    deadline = time.monotonic() + NORMAL_PHASE_SECONDS
    while not _shutdown.is_set() and time.monotonic() < deadline:
        time.sleep(0.25)

    if _shutdown.is_set():
        return 0

    # ---- Phase 2: go loud --------------------------------------------------
    log(f"normal phase complete — spawning {CPU_BURNER_THREADS} CPU threads + I/O thread")

    threads: list[threading.Thread] = []
    for i in range(CPU_BURNER_THREADS):
        t = threading.Thread(target=cpu_burner, args=(i,), name=f"burner-{i}", daemon=True)
        t.start()
        threads.append(t)

    io_thread = threading.Thread(target=io_thrasher, name="io-thrasher", daemon=True)
    io_thread.start()
    threads.append(io_thread)

    # Main thread stays alive and interruptible so SIGSTOP/SIGCONT/SIGKILL
    # from the NEXUS engine land on a live process.
    try:
        while not _shutdown.is_set():
            time.sleep(0.5)
    except KeyboardInterrupt:
        _shutdown.set()

    for t in threads:
        t.join(timeout=2.0)

    log("exited cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
