import { useState, useRef } from "react";

const DEFAULT_MINUTES = 10;
const PRESET_MINUTES = [5, 10, 15, 20];

/* ── Web Audio helpers ── */
function beep(frequency, duration, volume = 0.5, type = "sine") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
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

// 2-min warning: two medium beeps (C5)
function playTwoMinWarning() {
  beep(523, 0.25, 0.6);
  setTimeout(() => beep(523, 0.25, 0.6), 350);
}

// 1-min warning: three urgent beeps (G5)
function playOneMinWarning() {
  beep(784, 0.25, 0.7);
  setTimeout(() => beep(784, 0.25, 0.7), 350);
  setTimeout(() => beep(784, 0.25, 0.7), 700);
}

// Last-10-sec tick: short click (E5)
function playTick() {
  beep(660, 0.08, 0.45, "square");
}

// Time's up: descending alarm (C6 → A5 → C6)
function playTimeUp() {
  beep(1047, 0.4, 0.85);
  setTimeout(() => beep(880, 0.4, 0.85), 450);
  setTimeout(() => beep(1047, 0.7, 0.9), 900);
}

/* ── Component ── */
export default function GameTimer() {
  const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60);
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const remainingRef = useRef(DEFAULT_MINUTES * 60);
  const alertedRef = useRef({ twoMin: false, oneMin: false, tenSec: new Set() });
  const intervalRef = useRef(null);

  const tick = () => {
    const next = remainingRef.current - 1;
    remainingRef.current = Math.max(next, 0);
    setRemaining(remainingRef.current);

    if (next === 120 && !alertedRef.current.twoMin) {
      alertedRef.current.twoMin = true;
      playTwoMinWarning();
    }
    if (next === 60 && !alertedRef.current.oneMin) {
      alertedRef.current.oneMin = true;
      playOneMinWarning();
    }
    if (next > 0 && next <= 10 && !alertedRef.current.tenSec.has(next)) {
      alertedRef.current.tenSec.add(next);
      playTick();
    }
    if (next === 0) {
      playTimeUp();
      clearInterval(intervalRef.current);
      setRunning(false);
      setDone(true);
    }
  };

  const handleStartPause = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      if (remainingRef.current === 0) return;
      intervalRef.current = setInterval(tick, 1000);
      setRunning(true);
    }
  };

  const handleReset = (mins) => {
    clearInterval(intervalRef.current);
    const secs = mins * 60;
    remainingRef.current = secs;
    setRemaining(secs);
    setTotalSeconds(secs);
    setRunning(false);
    setDone(false);
    alertedRef.current = { twoMin: false, oneMin: false, tenSec: new Set() };
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const isLastTen = remaining <= 10 && remaining > 0;
  const isCritical = remaining <= 60 && remaining > 0;    // last minute (orange)
  const isWarning  = remaining <= 120 && remaining > 60;  // 2-min zone (yellow)

  const timeColor = done       ? "text-gray-500"
    : isLastTen                ? "text-red-400"
    : isCritical               ? "text-orange-400"
    : isWarning                ? "text-yellow-400"
    :                            "text-white";

  const statusText = done        ? "Time's up! 🔔"
    : isLastTen && running       ? `⚡ ${remaining} sec!`
    : isCritical && !isLastTen   ? "Last minute!"
    : isWarning                  ? "2-min warning"
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
        <h2 className="font-bold text-lg">Game Timer ⏱️</h2>
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
