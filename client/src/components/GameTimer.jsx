import { useState, useRef, useEffect } from "react";

const DEFAULT_MINUTES = 10;
const PRESET_MINUTES = [5, 10, 15, 20];

/* ── Singleton AudioContext ──────────────────────────────────────────────────
   Browsers cap concurrent AudioContext instances and require the first one to
   be created inside a user-gesture handler. We create it lazily on first use
   (which always happens via a button click) and reuse it forever.             */
let sharedCtx = null;
function getCtx() {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sharedCtx.state === "suspended") sharedCtx.resume();
  return sharedCtx;
}

function beep(frequency, duration, volume = 0.5, type = "sine") {
  try {
    const ctx = getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

function playTwoMinWarning() {
  beep(523, 0.25, 0.6);
  setTimeout(() => beep(523, 0.25, 0.6), 350);
}

function playOneMinWarning() {
  beep(784, 0.25, 0.7);
  setTimeout(() => beep(784, 0.25, 0.7), 350);
  setTimeout(() => beep(784, 0.25, 0.7), 700);
}

function playTick() {
  beep(660, 0.08, 0.45, "square");
}

function playTimeUp() {
  beep(1047, 0.4, 0.85);
  setTimeout(() => beep(880,  0.4, 0.85), 450);
  setTimeout(() => beep(1047, 0.7, 0.9),  900);
}

/* ── Component ── */
export default function GameTimer() {
  const [remaining, setRemaining]     = useState(DEFAULT_MINUTES * 60);
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_MINUTES * 60);
  const [running, setRunning]         = useState(false);
  const [done, setDone]               = useState(false);
  const [wakeLocked, setWakeLocked]   = useState(false);

  const remainingRef  = useRef(DEFAULT_MINUTES * 60);
  const alertedRef    = useRef({ twoMin: false, oneMin: false, tenSec: new Set() });
  const intervalRef   = useRef(null);
  const runningRef    = useRef(false);
  const startWallRef  = useRef(null);
  const startRemRef   = useRef(null);
  const wakeLockRef   = useRef(null);

  /* ── Wake Lock ─────────────────────────────────────────────────────────────
     Keeps the screen alive so the browser never backgrounds while the timer
     is running. Released automatically when the user stops/resets.           */
  async function acquireWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setWakeLocked(true);
      wakeLockRef.current.addEventListener("release", () => setWakeLocked(false));
    } catch (_) {}
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      setWakeLocked(false);
    }
  }

  /* ── Time calculation ──────────────────────────────────────────────────── */
  function computeNext() {
    if (!startWallRef.current) return remainingRef.current;
    const elapsed = Math.floor((Date.now() - startWallRef.current) / 1000);
    return Math.max(startRemRef.current - elapsed, 0);
  }

  /* ── Alert logic ───────────────────────────────────────────────────────────
     Handles jumps (e.g. phone was locked briefly despite wake lock): plays
     every missed tick in the last 10 seconds, staggered so they don't overlap. */
  function checkAlerts(prev, next) {
    if (prev > 120 && next <= 120 && !alertedRef.current.twoMin) {
      alertedRef.current.twoMin = true;
      playTwoMinWarning();
    }
    if (prev > 60 && next <= 60 && !alertedRef.current.oneMin) {
      alertedRef.current.oneMin = true;
      playOneMinWarning();
    }
    // Play every missed tick in the last 10 seconds (catches up after a gap)
    const hi = Math.min(prev - 1, 10);
    const lo = Math.max(next, 1);
    for (let s = hi; s >= lo; s--) {
      if (!alertedRef.current.tenSec.has(s)) {
        alertedRef.current.tenSec.add(s);
        const delay = (hi - s) * 150;
        delay === 0 ? playTick() : setTimeout(playTick, delay);
      }
    }
    if (next === 0 && prev > 0) playTimeUp();
  }

  /* ── Core sync ─────────────────────────────────────────────────────────── */
  function syncTimer() {
    const next = computeNext();
    const prev = remainingRef.current;
    if (next === prev) return;
    remainingRef.current = next;
    setRemaining(next);
    checkAlerts(prev, next);
    if (next === 0) {
      clearInterval(intervalRef.current);
      releaseWakeLock();
      runningRef.current = false;
      setRunning(false);
      setDone(true);
    }
  }

  /* ── Visibility change: re-sync + re-acquire wake lock on return ──────── */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && runningRef.current) {
        syncTimer();
        acquireWakeLock(); // re-acquire if OS released it (e.g. manual lock)
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Controls ──────────────────────────────────────────────────────────── */
  const handleStartPause = () => {
    if (running) {
      const current = computeNext();
      remainingRef.current = current;
      setRemaining(current);
      clearInterval(intervalRef.current);
      releaseWakeLock();
      runningRef.current = false;
      setRunning(false);
    } else {
      if (remainingRef.current === 0) return;
      // Create/resume AudioContext inside the user gesture so iOS allows it
      getCtx();
      startWallRef.current = Date.now();
      startRemRef.current  = remainingRef.current;
      runningRef.current   = true;
      setRunning(true);
      acquireWakeLock();
      intervalRef.current = setInterval(syncTimer, 500);
    }
  };

  const handleReset = (mins) => {
    clearInterval(intervalRef.current);
    releaseWakeLock();
    const secs = mins * 60;
    remainingRef.current = secs;
    startWallRef.current = null;
    startRemRef.current  = null;
    runningRef.current   = false;
    setRemaining(secs);
    setTotalSeconds(secs);
    setRunning(false);
    setDone(false);
    alertedRef.current = { twoMin: false, oneMin: false, tenSec: new Set() };
  };

  const minutes  = Math.floor(remaining / 60);
  const seconds  = remaining % 60;
  const isLastTen  = remaining <= 10 && remaining > 0;
  const isCritical = remaining <= 60 && remaining > 0;
  const isWarning  = remaining <= 120 && remaining > 60;

  const timeColor = done       ? "text-gray-500"
    : isLastTen               ? "text-red-400"
    : isCritical              ? "text-orange-400"
    : isWarning               ? "text-yellow-400"
    :                           "text-white";

  const statusText = done              ? "Time's up! 🔔"
    : isLastTen && running             ? `⚡ ${remaining} sec!`
    : isCritical && !isLastTen         ? "Last minute!"
    : isWarning                        ? "2-min warning"
    : null;

  const statusColor = done || isLastTen ? "text-red-400"
    : isCritical                        ? "text-orange-400"
    :                                     "text-yellow-400";

  return (
    <div className={`bg-brand-card rounded-2xl p-5 mb-6 transition-all ${
      isLastTen && running ? "ring-2 ring-red-500/50" : ""
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg">Game Timer ⏱️</h2>
          {wakeLocked && (
            <span className="text-xs text-green-400 font-bold" title="Screen kept awake">🔒</span>
          )}
        </div>
        <div className="flex gap-1">
          {PRESET_MINUTES.map(m => (
            <button key={m} onClick={() => handleReset(m)}
              className={`text-xs px-2.5 py-1 rounded-lg transition font-bold ${
                totalSeconds === m * 60
                  ? "bg-brand-orange text-white"
                  : "bg-gray-700 text-gray-400 hover:text-white"
              }`}>
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Big countdown */}
      <div className={`text-center py-4 ${isLastTen && running ? "animate-pulse" : ""}`}>
        <span className={`text-7xl font-mono font-bold tabular-nums tracking-tight ${timeColor}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        {statusText && (
          <p className={`text-sm font-bold mt-1 ${statusColor}`}>{statusText}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={handleStartPause}
          disabled={done}
          className="flex-1 bg-brand-orange hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition"
        >
          {running ? "⏸ Pause" : done ? "Done ✓" : remaining === totalSeconds ? "▶ Start" : "▶ Resume"}
        </button>
        <button
          onClick={() => handleReset(totalSeconds / 60)}
          className="px-5 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold transition"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
