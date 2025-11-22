import React, { useState, useEffect, useRef, memo } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import {
  Activity,
  Wifi,
  Zap,
  Target,
  Brain,
  HeartPulse,
  ShieldCheck,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  X,
  FileText,
  Wind,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';

// Socket connection to your Flask backend
const socket = io('http://localhost:5000');

// Limit points in graphs
const GRAPH_LIMIT = 50;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const ZEN_COOLDOWN_MS = 5 * 60 * 1000; // 5 min cooldown between Zen activations

// Utility: random pick
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Voice scripts
const HIGH_STRESS_VOICE_LINES = [
  "Your cursor looks a bit tense. Unclench your jaw, let your shoulders drop and take one slow breath in, one long breath out.",
  "I'm seeing faster, less steady movements. Rest your hands on the desk for ten seconds and soften your grip on the mouse.",
  "Micro‑stress detected. Look away from the screen, roll your shoulders once or twice, then come back to your work."
];

const RECOVERY_VOICE_LINES = [
  "Your movements look steadier again. Stay with this softer pace and notice your breathing.",
  "You're back in a calmer focus zone. This is a good time for deep, uninterrupted work.",
  "Cursor patterns are smoother now. Keep your shoulders relaxed and let your breath stay slow."
];

const CALM_FOCUS_VOICE_LINES = [
  "You’re in a stable focus window. If possible, mute one distraction and stay with your current task.",
  "Cursor movement looks calm and consistent. This is a great moment for meaningful, concentrated work.",
  "You're in a balanced state. Keep your posture comfortable, and let your breathing stay unforced."
];

// Tips
const HIGH_STRESS_TIPS = [
  {
    title: '60‑second nervous system reset',
    body: 'Small spikes in tension are normal, especially under deadline. A short reset prevents them from stacking into fatigue.',
    action: 'Breathe in for 4 seconds, out for 6, following the expanding circle. Repeat for 5–8 breaths.'
  },
  {
    title: 'Relax the upper body',
    body: 'Stress often shows up in the shoulders, neck, jaw and hands during intense screen time.',
    action: 'Drop your shoulders, let your hands rest on the desk and gently unclench your jaw for three slow breaths.'
  },
  {
    title: 'Eyes & posture check‑in',
    body: 'Rapid, jittery movements can mean scanning emails, chats and tabs all at once.',
    action: 'Use the 20‑20‑20 rule: every 20 minutes, look 20 feet away for 20 seconds and gently straighten your spine.'
  },
  {
    title: 'Micro‑break for nervous system',
    body: 'Your nervous system needs short breaks more often than long, rare ones.',
    action: 'Stand up for 30–60 seconds, stretch your arms overhead and let your hands hang at your sides before sitting back down.'
  }
];

const CALM_TIPS = [
  {
    title: 'Steady focus window',
    body: 'Your cursor shows a calm, steady pattern — a healthy place for deep or creative work.',
    action: 'Protect this state: silence one notification or close one non‑essential tab for the next 20–30 minutes.'
  },
  {
    title: 'Gentle rhythm',
    body: 'Smooth movements suggest your nervous system is not currently overloaded.',
    action: 'Keep breathing slowly. Notice if your chair, screen height or wrist position still feel comfortable.'
  },
  {
    title: 'Sustainable pace',
    body: 'Short, stable focus blocks with micro‑breaks are better for long‑term health than pushing through strain.',
    action: 'Decide now when your next small pause will be — for example, in 25 minutes.'
  },
  {
    title: 'Body awareness',
    body: 'Digital work is mostly mental, but the body absorbs the load.',
    action: 'Press your feet gently into the floor, lengthen your spine and let your shoulders soften down and back.'
  }
];

// -----------------------------------------------------------------------------
// Animated number using Framer Motion
// -----------------------------------------------------------------------------
const AnimatedNumber = memo(function AnimatedNumber({ value, decimals = 0 }) {
  const spring = useSpring(value, { stiffness: 120, damping: 18 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(v));
    return () => unsub();
  }, [spring]);

  return <span>{display.toFixed(decimals)}</span>;
});

// -----------------------------------------------------------------------------
// Logo component from provided SVG
// -----------------------------------------------------------------------------
function NeuroLogo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="violetGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#8000ff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8000ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* transparent background so it blends with the app */}
      <rect width="800" height="600" fill="none" />

      <g transform="translate(400, 300)">
        <g fill="none" strokeWidth="2" strokeLinecap="round">
          <g stroke="#00ffff" opacity="0.8">
            <path
              d="M-150,-80 C-180,-50 -180,50 -150,80 C-120,110 -50,110 -20,80 C10,50 10,-50 -20,-80 C-50,-110 -120,-110 -150,-80 Z"
              fill="url(#cyanGlow)"
              opacity="0.2"
            />
            <path d="M-140,-70 L-120,-70 L-120,-50 M-160,-40 L-130,-40 L-130,-20 M-170,0 L-140,0 M-160,40 L-130,40 L-130,60 M-140,70 L-120,70 L-120,90" />
            <circle cx="-140" cy="-70" r="3" fill="#00ffff" />
            <circle cx="-160" cy="-40" r="3" fill="#00ffff" />
            <circle cx="-170" cy="0" r="3" fill="#00ffff" />
            <circle cx="-160" cy="40" r="3" fill="#00ffff" />
            <circle cx="-140" cy="70" r="3" fill="#00ffff" />
            <path d="M-100,-90 L-100,-60 L-80,-60 M-70,-100 L-70,-80 M-40,-90 L-40,-60 L-20,-60 M-10,-100 L-10,-80" />
            <circle cx="-100" cy="-90" r="3" fill="#00ffff" />
            <circle cx="-70" cy="-100" r="3" fill="#00ffff" />
            <circle cx="-40" cy="-90" r="3" fill="#00ffff" />
            <circle cx="-10" cy="-100" r="3" fill="#00ffff" />
          </g>
          <g stroke="#8000ff" opacity="0.8">
            <path
              d="M150,-80 C180,-50 180,50 150,80 C120,110 50,110 20,80 C-10,50 -10,-50 20,-80 C50,-110 120,-110 150,-80 Z"
              fill="url(#violetGlow)"
              opacity="0.2"
            />
            <path d="M140,-70 L120,-70 L120,-50 M160,-40 L130,-40 L130,-20 M170,0 L140,0 M160,40 L130,40 L130,60 M140,70 L120,70 L120,90" />
            <circle cx="140" cy="-70" r="3" fill="#8000ff" />
            <circle cx="160" cy="-40" r="3" fill="#8000ff" />
            <circle cx="170" cy="0" r="3" fill="#8000ff" />
            <circle cx="160" cy="40" r="3" fill="#8000ff" />
            <circle cx="140" cy="70" r="3" fill="#8000ff" />
            <path d="M100,-90 L100,-60 L80,-60 M70,-100 L70,-80 M40,-90 L40,-60 L20,-60 M10,-100 L10,-80" />
            <circle cx="100" cy="-90" r="3" fill="#8000ff" />
            <circle cx="70" cy="-100" r="3" fill="#8000ff" />
            <circle cx="40" cy="-90" r="3" fill="#8000ff" />
            <circle cx="10" cy="-100" r="3" fill="#8000ff" />
          </g>
        </g>
      </g>

      <g transform="translate(400, 300) scale(4)">
        <polygon
          points="0,0 0,18 4,14 7,20 9,19 6,13 12,13"
          fill="#ffffff"
        />
      </g>
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Existing components (NeuroOrb, SessionInsights, WellnessCoach, Privacy, Summary)
// -----------------------------------------------------------------------------
function NeuroOrb({ stressLevel, focusScore }) {
  const tension = Math.max(0, 100 - focusScore);
  const scale = 1 + tension / 350;
  const isHigh = stressLevel === 'HIGH';

  const ringColor = isHigh
    ? 'from-rose-400/40 to-rose-500/70'
    : 'from-emerald-300/40 to-emerald-400/70';
  const shadowColor = isHigh
    ? 'rgba(248,113,113,0.5)'
    : 'rgba(52,211,153,0.5)';
  const label = isHigh ? 'Tension signal' : 'Calm focus field';

  return (
    <div className="flex items-center justify-center">
      <div
        className={`neuro-orb border ${
          isHigh ? 'border-rose-400/60' : 'border-emerald-300/60'
        }`}
        style={{ boxShadow: `0 0 40px ${shadowColor}` }}
      >
        <div
          className={`neuro-orb-core bg-gradient-to-br ${ringColor}`}
          style={{ transform: `scale(${scale})` }}
        >
          <span className="text-[9px] uppercase tracking-[0.24em] text-slate-200/80">
            {label}
          </span>
          <p className="mt-1 text-2xl font-semibold text-white">
            {Math.round(focusScore)}%
          </p>
          <p className="text-[10px] text-slate-300">focus stability</p>
        </div>
        <div className="neuro-orb-glow" />
      </div>
    </div>
  );
}

function SessionInsights({ sessionStats, durationMs }) {
  const minutesHigh = sessionStats.highMs / 60000;
  const totalMinutes = durationMs / 60000 || 0.01;
  const avgFocus = sessionStats.samples ? sessionStats.avgFocus : 100;
  const highFraction =
    durationMs > 0 ? sessionStats.highMs / durationMs : 0;
  const loadIndex = Math.round(highFraction * 100);

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 text-left shadow-md space-y-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">
        <Clock size={14} className="text-emerald-300" />
        <span>Session snapshot</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-slate-400 text-[11px]">Micro‑stress events</p>
          <p className="text-lg font-semibold text-slate-50">
            {sessionStats.microStressEvents}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-[11px]">Time in high load</p>
          <p className="text-lg font-semibold text-slate-50">
            {minutesHigh < 0.1 ? '< 0.1' : minutesHigh.toFixed(1)} min
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-[11px]">Avg. focus</p>
          <p className="text-lg font-semibold text-slate-50">
            {Math.round(avgFocus)}%
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Nervous system load index</span>
        <span
          className={
            loadIndex > 60
              ? 'text-rose-300'
              : loadIndex > 30
              ? 'text-amber-300'
              : 'text-emerald-300'
          }
        >
          {loadIndex}%
        </span>
      </div>
      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        <Sparkles size={12} className="text-emerald-300" />
        Data never leaves your device. Patterns only, no screen content.
      </p>
    </div>
  );
}

function WellnessCoach({ card, stressLevel, focusScore }) {
  const isHigh = stressLevel === 'HIGH';

  return (
    <motion.div
      layout
      className={`p-6 border rounded-xl bg-slate-900/80 backdrop-blur-md shadow-lg relative overflow-hidden
      ${isHigh ? 'border-rose-300/50' : 'border-emerald-300/40'}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <HeartPulse
              size={16}
              className={isHigh ? 'text-rose-400' : 'text-emerald-300'}
            />
            <span>{isHigh ? 'Micro‑stress support' : 'Digital focus hygiene'}</span>
            <span className="mx-2">•</span>
            <span className="text-slate-500">
              Focus score: {Math.round(focusScore)}%
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white mt-2">
            {card.title}
          </h2>
          <p className="text-sm text-slate-300/90 mt-2">{card.body}</p>
          <p className="text-xs text-slate-400 mt-3">{card.action}</p>
          <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em]">
            Not a medical device • For wellbeing & focus awareness only
          </p>
        </div>
        <div className="flex items-center justify-center">
          {isHigh ? (
            <div className="relative w-24 h-24 rounded-full border border-rose-300/60 bg-rose-500/5 breath-ring flex items-center justify-center text-[10px] text-rose-50">
              <span className="text-center leading-tight">
                Inhale 4s
                <br />
                Exhale 6s
              </span>
            </div>
          ) : (
            <div className="relative w-24 h-24 rounded-xl border border-emerald-300/70 bg-emerald-400/5 flex items-center justify-center text-[10px] text-emerald-50 focus-orbit">
              <span className="text-center leading-tight">
                Calm
                <br />
                focus zone
              </span>
            </div>
          )}
        </div>
      </div>
      <div
        className={`absolute -right-24 -bottom-24 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none
        ${isHigh ? 'bg-rose-500/40' : 'bg-emerald-400/40'}`}
      />
    </motion.div>
  );
}

function PrivacyCard() {
  return (
    <motion.div
      layout
      className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md text-left space-y-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">
        <ShieldCheck size={14} className="text-sky-300" />
        <span>Privacy & digital trust</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
        All analysis runs entirely on your device. The system never inspects
        your screen content or keystrokes, it only looks at cursor motion
        patterns to estimate micro‑stress.
      </p>
      <p className="text-[10px] text-slate-500">
        No accounts, no cloud sync, no raw behavioral logs stored.
      </p>
    </motion.div>
  );
}

function SessionSummaryModal({ open, snapshot, onClose, onNewSession }) {
  if (!open || !snapshot) return null;

  const { stats, durationMs } = snapshot;
  const totalMinutes = durationMs / 60000 || 0.01;
  const highMinutes = stats.highMs / 60000;
  const highFraction =
    durationMs > 0 ? stats.highMs / durationMs : 0;
  const avgFocus = stats.samples ? stats.avgFocus : 100;

  const highScore = (1 - Math.min(highFraction, 1)) * 100;
  const wellbeingScore = Math.round(0.6 * avgFocus + 0.4 * highScore);

  let profile = '';
  let recommendation = '';

  if (wellbeingScore >= 80) {
    profile = 'Balanced & sustainable';
    recommendation =
      'Your pattern suggests healthy focus with manageable spikes. Keep using short breaks and posture checks to maintain this.';
  } else if (wellbeingScore >= 60) {
    profile = 'Moderate cognitive load';
    recommendation =
      'You handled focus fairly well, but there were meaningful periods of high tension. Add one or two structured micro‑breaks to protect energy.';
  } else {
    profile = 'High strain — needs recovery';
    recommendation =
      'There were extended periods of overload. A longer break away from screens and some gentle movement would be helpful.';
  }

  const summaryText = `Neuro-Cursor Session Report
----------------------------

Duration: ${totalMinutes.toFixed(1)} min
Digital Wellbeing Score: ${wellbeingScore}/100
Profile: ${profile}

Micro-stress events: ${stats.microStressEvents}
Time in high load: ${highMinutes.toFixed(1)} min
Average focus score: ${Math.round(avgFocus)}%
Estimated nervous system load index: ${Math.round(
    highFraction * 100
  )}%

Recommendation:
${recommendation}

Note: This is not a medical device. It reflects mouse movement patterns only, as a gentle signal for digital wellbeing and focus awareness.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      alert('Session summary copied to clipboard.');
    } catch {
      alert('Unable to copy. Please select and copy manually.');
    }
  };

  const ringGradient = `conic-gradient(#22c55e ${wellbeingScore}%, rgba(30,64,175,0.3) ${wellbeingScore}% 100%)`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundImage: ringGradient }}
          >
            <div className="w-14 h-14 rounded-full bg-slate-950 flex flex-col items-center justify-center text-xs">
              <span className="text-[9px] text-slate-400">Score</span>
              <span className="text-lg font-semibold text-emerald-300">
                {wellbeingScore}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-1">
              Session report
            </p>
            <h2 className="text-lg font-semibold text-slate-50">
              Digital wellbeing snapshot
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {totalMinutes.toFixed(1)} minutes • {profile}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300 mb-4">
          <p>
            Micro‑stress events:{' '}
            <span className="font-semibold">
              {stats.microStressEvents}
            </span>
          </p>
          <p>
            Time in high load:{' '}
            <span className="font-semibold">
              {highMinutes.toFixed(1)} min
            </span>
          </p>
          <p>
            Average focus score:{' '}
            <span className="font-semibold">
              {Math.round(avgFocus)}%
            </span>
          </p>
          <p>
            Nervous system load index:{' '}
            <span className="font-semibold">
              {Math.round(highFraction * 100)}%
            </span>
          </p>
        </div>

        <div className="mb-4">
          <p className="text-[11px] text-slate-200 font-medium mb-1">
            AI‑driven insight
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {recommendation}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-between items-center mt-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/80 text-[11px] text-slate-200 hover:border-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <FileText size={14} />
            <span>Copy summary</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={onNewSession}
              className="px-3 py-1.5 rounded-full border border-emerald-300/70 bg-emerald-500/10 text-[11px] text-emerald-200 hover:bg-emerald-500/20 transition-colors"
            >
              Start new session
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/80 text-[11px] text-slate-200 hover:border-slate-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <p className="mt-3 text-[9px] text-slate-500">
          This report reflects mouse movement patterns only. It is a wellbeing
          tool, not a medical or diagnostic device.
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// New: Smart Break Ring, Health Shield, Zen side widget, Strain Banner
// -----------------------------------------------------------------------------
const SmartBreakRing = memo(function SmartBreakRing({
  charge, // 0–1
  stress,
  nextBreakSeconds
}) {
  const arc = clamp(charge * 100, 0, 100);
  const ringGradient = `conic-gradient(#22c55e ${arc}%, rgba(15,23,42,1) ${arc}% 100%)`;
  const stressLabel =
    stress > 70 ? 'High strain' : stress > 40 ? 'Elevated' : 'Light load';

  const seconds = Math.max(0, Math.round(nextBreakSeconds));
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const timeLabel = `${min}:${sec.toString().padStart(2, '0')}`;

  return (
    <motion.div
      layout
      className="relative h-56 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-950 to-slate-900/90 backdrop-blur-xl shadow-[0_0_40px_rgba(15,23,42,0.9)] flex flex-col items-center justify-center gap-4 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),transparent_60%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{ backgroundImage: ringGradient }}
        >
          <div className="w-24 h-24 rounded-full bg-slate-950 flex flex-col items-center justify-center text-center">
            <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400">
              Smart break
            </p>
            <p className="text-lg font-semibold text-emerald-300">
              <AnimatedNumber value={arc} />%
            </p>
            <p className="text-[10px] text-slate-400">
              workload charge
            </p>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-300">
            Load‑adaptive Pomodoro
          </p>
          <p className="text-[11px] text-slate-400">
            Next recommended reset in{' '}
            <span className="text-emerald-300 font-medium">
              {timeLabel}
            </span>
            .
          </p>
          <p className="text-[10px] text-slate-500">
            Current strain:{' '}
            <span className="text-slate-300">{stressLabel}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
});

const HealthShield = memo(function HealthShield({ hp, stress }) {
  const hpColor =
    hp > 70
      ? 'from-emerald-400 to-sky-400'
      : hp > 40
      ? 'from-amber-300 to-amber-500'
      : 'from-rose-400 to-rose-500';

  return (
    <motion.div
      layout
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900 shadow-[0_0_34px_rgba(15,23,42,0.85)] p-4 flex flex-col gap-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span>Health shield</span>
          </p>
          <p className="text-xs text-slate-400">
            Smooth, efficient movement regenerates the shield. Erratic patterns
            chip it away.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Shield integrity</p>
          <p className="text-xl font-semibold text-slate-50">
            <AnimatedNumber value={hp} />%
          </p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${hpColor}`}
          style={{ width: `${clamp(hp, 0, 100)}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Strain level</span>
        <span>
          <AnimatedNumber value={stress} /> / 100
        </span>
      </div>
    </motion.div>
  );
});

// Non-blocking side widget for breathing (bottom-right)
const ZenWidget = memo(function ZenWidget({
  active,
  secondsLeft,
  onClose
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed bottom-4 right-4 z-30"
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
        >
          <div className="p-4 rounded-xl border border-emerald-300/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl flex items-center gap-4 max-w-sm">
            <motion.div
              className="w-16 h-16 rounded-full border border-emerald-300/50 bg-emerald-400/5 flex items-center justify-center"
              animate={{ scale: [0.9, 1.1, 0.9] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <motion.div
                className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400/60 via-emerald-300/50 to-sky-300/60 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Wind size={18} className="mb-1 text-slate-900" />
                <p className="text-[9px] font-medium text-slate-900">
                  Inhale 4s
                </p>
                <p className="text-[9px] font-medium text-slate-900">
                  Exhale 6s
                </p>
              </motion.div>
            </motion.div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-200">
                Guided micro‑reset
              </p>
              <p className="text-[11px] text-slate-300">
                Follow the circle with your breath. This runs on the side so it
                never blocks your work.
              </p>
              <p className="text-[10px] text-slate-400">
                Remaining:{' '}
                <span className="text-emerald-300 font-medium">
                  {secondsLeft}s
                </span>
              </p>
              <button
                onClick={onClose}
                className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 hover:text-slate-200"
              >
                Skip reset
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

const StrainBanner = memo(function StrainBanner({ visible, level }) {
  const text =
    level === 'HIGH'
      ? 'High nervous system load detected. A micro‑break is recommended.'
      : 'Elevated load — consider a short posture and breathing check.';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          layout
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-center gap-2 rounded-xl border border-rose-400/60 bg-rose-500/10 px-4 py-2 text-xs text-rose-100 shadow-[0_0_24px_rgba(248,113,113,0.35)]"
        >
          <AlertTriangle size={16} className="text-rose-300" />
          <span>{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// -----------------------------------------------------------------------------
// MAIN APP
// -----------------------------------------------------------------------------
function App() {
  const [metrics, setMetrics] = useState({
    velocity: 0,
    jitter: 0,
    stress_level: 'LOW',
    ai_active: false,
    learning_progress: 0
  });

  const [graphData, setGraphData] = useState([]);
  const [connected, setConnected] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [wellnessCard, setWellnessCard] = useState(CALM_TIPS[0]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [shieldHp, setShieldHp] = useState(85);
  const [breakCharge, setBreakCharge] = useState(0);
  const [zenActive, setZenActive] = useState(false);
  const [zenSeconds, setZenSeconds] = useState(60);

  const [sessionStats, setSessionStats] = useState({
    microStressEvents: 0,
    highMs: 0,
    samples: 0,
    avgFocus: 100
  });

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summarySnapshot, setSummarySnapshot] = useState(null);

  const prevStatusRef = useRef('LOW');
  const lastVoiceTimeRef = useRef(0);
  const stateChangeTimeRef = useRef(Date.now());
  const lastPacketTimeRef = useRef(null);
  const runningFocusSumRef = useRef(0);
  const voiceEnabledRef = useRef(true);
  const lastMovementTimeRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const zenActiveRef = useRef(false);
  const zenLastTriggerRef = useRef(0);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    zenActiveRef.current = zenActive;
  }, [zenActive]);

  // Zen countdown
  useEffect(() => {
    if (!zenActive) return;
    if (zenSeconds <= 0) {
      setZenActive(false);
      return;
    }
    const id = setTimeout(() => {
      setZenSeconds((s) => s - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [zenActive, zenSeconds]);

  const speak = (text) => {
    if (!voiceEnabledRef.current) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.name.includes('Google US English')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  const triggerZen = () => {
    const now = Date.now();
    const idleNow = now - lastMovementTimeRef.current > 3000;
    if (idleNow) return; // never trigger when idle
    if (zenActiveRef.current) return;
    if (now - zenLastTriggerRef.current < ZEN_COOLDOWN_MS) return;
    setZenActive(true);
    setZenSeconds(60);
    zenLastTriggerRef.current = now;
  };

  // Focus from jitter
  const focusScore = Math.max(0, Math.min(100, 100 - metrics.jitter / 3));
  const stressScore = Math.max(0, Math.min(100, 100 - focusScore));

  // Approx seconds to next break based on current load
  const approxSecondsToBreak = (() => {
    const remaining = 1 - breakCharge;
    const basePerSecond = 0.012;
    const stressBoostPerSecond = (stressScore / 100) * 0.045;
    const rate = basePerSecond + stressBoostPerSecond;
    if (rate <= 0) return 999;
    return remaining / rate;
  })();

  // Trigger Zen when Smart Break ring fills
  useEffect(() => {
    if (breakCharge >= 0.99) {
      setBreakCharge(0);
      triggerZen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakCharge]);

  // Core socket / analytics / AI coach
  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('✅ Connected to Neural Backend');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('mouse_data', (newData) => {
      const now = Date.now();
      setMetrics(newData);

      // Graph
      setGraphData((prev) => {
        const newPoint = { velocity: newData.velocity, jitter: newData.jitter };
        const updated = [...prev, newPoint];
        if (updated.length > GRAPH_LIMIT) updated.shift();
        return updated;
      });

      const localFocusScore = Math.max(
        0,
        Math.min(100, 100 - newData.jitter / 3)
      );
      const localStressScore = 100 - localFocusScore;

      // Track any small movement as "active"
      if (newData.velocity > 2 || newData.jitter > 2) {
        lastMovementTimeRef.current = now;
      }
      const idleNow = now - lastMovementTimeRef.current > 3000; // 3s no movement = idle for coaching

      // Session stats
      const prevStatus = prevStatusRef.current;
      const lastTime = lastPacketTimeRef.current;
      const dt = lastTime ? now - lastTime : 0;
      const dtSeconds = dt / 1000;

      setSessionStats((prevStats) => {
        const microStressEvents =
          prevStatus === 'LOW' && newData.stress_level === 'HIGH'
            ? prevStats.microStressEvents + 1
            : prevStats.microStressEvents;

        const highMs =
          newData.stress_level === 'HIGH'
            ? prevStats.highMs + dt
            : prevStats.highMs;

        const samples = prevStats.samples + 1;
        runningFocusSumRef.current += localFocusScore;
        const avgFocus = runningFocusSumRef.current / samples;

        return {
          microStressEvents,
          highMs,
          samples,
          avgFocus
        };
      });

      lastPacketTimeRef.current = now;

      // Health shield dynamics
      setShieldHp((prev) => {
        const damageRate = (localStressScore / 100) * 26;
        const regenRate = ((100 - localStressScore) / 100) * 18;
        const netPerSecond = (regenRate - damageRate) / 60;
        const newHp = clamp(prev + netPerSecond * dtSeconds, 0, 100);
        return newHp;
      });

      // Smart Break charge (no Zen trigger here; handled in separate effect)
      setBreakCharge((prev) => {
        const basePerSecond = 0.012;
        const stressBoostPerSecond = (localStressScore / 100) * 0.045;
        const delta = (basePerSecond + stressBoostPerSecond) * dtSeconds;
        return clamp(prev + delta, 0, 1);
      });

      // Voice logic
      const timeSinceVoice = now - lastVoiceTimeRef.current;

      // If idle (no movement for a while), don't speak or trigger Zen
      if (idleNow) {
        prevStatusRef.current = newData.stress_level;
        return;
      }

      if (newData.stress_level !== prevStatus) {
        const previousStateDuration = now - stateChangeTimeRef.current;
        stateChangeTimeRef.current = now;

        // Entering HIGH
        if (
          newData.stress_level === 'HIGH' &&
          timeSinceVoice > 45_000
        ) {
          speak(pickRandom(HIGH_STRESS_VOICE_LINES));
          lastVoiceTimeRef.current = now;
          triggerZen();
        }

        // Coming down from sustained HIGH
        if (
          newData.stress_level === 'LOW' &&
          prevStatus === 'HIGH' &&
          previousStateDuration > 15_000 &&
          timeSinceVoice > 45_000
        ) {
          speak(pickRandom(RECOVERY_VOICE_LINES));
          lastVoiceTimeRef.current = now;
        }
      } else {
        // Staying HIGH for a long time
        if (newData.stress_level === 'HIGH') {
          const timeInHigh = now - stateChangeTimeRef.current;
          if (timeInHigh > 120_000 && timeSinceVoice > 90_000) {
            speak(pickRandom(HIGH_STRESS_VOICE_LINES));
            lastVoiceTimeRef.current = now;
            stateChangeTimeRef.current = now;
            triggerZen();
          }
        }

        // Long calm focus
        if (newData.stress_level === 'LOW' && localFocusScore > 70) {
          const timeInLow = now - stateChangeTimeRef.current;
          if (timeInLow > 120_000 && timeSinceVoice > 120_000) {
            speak(pickRandom(CALM_FOCUS_VOICE_LINES));
            lastVoiceTimeRef.current = now;
            stateChangeTimeRef.current = now;
          }
        }
      }

      prevStatusRef.current = newData.stress_level;
    });

    socket.on('calibration_done', () => {
      setIsCalibrating(false);
      speak(
        'Calibration complete. I will now track micro‑stress and focus patterns in the background.'
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('mouse_data');
      socket.off('calibration_done');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (metrics.stress_level === 'HIGH') {
      setWellnessCard(pickRandom(HIGH_STRESS_TIPS));
    } else {
      setWellnessCard(pickRandom(CALM_TIPS));
    }
  }, [metrics.stress_level]);

  const focusDescriptor =
    metrics.stress_level === 'HIGH'
      ? 'Elevated load'
      : focusScore > 70
      ? 'Steady focus'
      : 'Light focus';

  const sessionDurationMs = Date.now() - sessionStartRef.current;

  const handleOpenSummary = () => {
    const now = Date.now();
    const durationMs = now - sessionStartRef.current;
    setSummarySnapshot({
      stats: sessionStats,
      durationMs
    });
    setSummaryOpen(true);
  };

  const handleNewSession = () => {
    setSessionStats({
      microStressEvents: 0,
      highMs: 0,
      samples: 0,
      avgFocus: 100
    });
    runningFocusSumRef.current = 0;
    sessionStartRef.current = Date.now();
    setSummaryOpen(false);
  };

  const handleRecalibrate = () => {
    setIsCalibrating(true);
    speak(
      'Recalibrating to your current style. For the next few seconds, move your mouse as you normally would.'
    );
    socket.emit('start_calibration');
  };

  const ekgStrokeColor =
    metrics.stress_level === 'HIGH' ? '#f97373' : '#4ade80';

  const showStrainBanner = metrics.stress_level !== 'LOW';

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-50 flex items-center justify-center px-4 py-6 selection:bg-emerald-200 selection:text-slate-900">
      <motion.div
        className="w-full max-w-6xl flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* MAIN DASHBOARD CARD */}
        <motion.div
          layout
          className={`w-full p-6 border rounded-2xl transition-all duration-500 flex flex-col gap-5 relative overflow-hidden bg-slate-900/90
            ${
              metrics.stress_level === 'HIGH'
                ? 'border-rose-300/40 shadow-[0_0_40px_rgba(248,113,113,0.20)]'
                : 'border-slate-800 shadow-[0_0_36px_rgba(15,23,42,0.9)]'
            }`}
        >
          <div className="pointer-events-none absolute -top-32 -right-32 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 w-72 h-72 bg-sky-500/5 blur-3xl rounded-full" />

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
            <div className="text-left space-y-2">
              <div className="flex items-center gap-3">
                <NeuroLogo className="w-16 h-12 md:w-20 md:h-16" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300 flex items-center gap-2">
                    <Brain size={14} />
                    <span>NeuroCursor</span>
                  </p>
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-[0.18em] text-white">
                    Preventative Digital Health Command Center
                  </h1>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 max-w-md leading-relaxed">
                Uses tiny changes in your mouse path as a gentle signal of
                cognitive load, burnout risk and micro‑stress. Designed for
                digital wellbeing, focus hygiene and early ergonomic awareness —
                not as a diagnostic or medical device.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Calibration / Recalibration */}
              {!metrics.ai_active && (
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97, y: 0 }}
                  onClick={() => {
                    setIsCalibrating(true);
                    speak(
                      'Starting calibration. For the next few seconds, move your mouse as you normally would.'
                    );
                    socket.emit('start_calibration');
                  }}
                  disabled={isCalibrating}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full border font-semibold text-xs tracking-[0.18em] transition-all duration-300
                            ${
                              isCalibrating
                                ? 'bg-amber-500/10 border-amber-300 text-amber-200 animate-pulse cursor-wait'
                                : 'bg-slate-900/60 border-slate-500 text-slate-100 hover:border-emerald-300 hover:text-emerald-200'
                            }`}
                >
                  <Target size={18} />
                  {isCalibrating
                    ? `CALIBRATING [${metrics.learning_progress}/50]`
                    : 'INITIALIZE COACH'}
                </motion.button>
              )}

              {metrics.ai_active && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97, y: 0 }}
                    onClick={handleRecalibrate}
                    disabled={isCalibrating}
                    className={`px-4 py-2 rounded-full border text-[10px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-2
                      ${
                        isCalibrating
                          ? 'bg-amber-500/10 border-amber-300 text-amber-200 animate-pulse cursor-wait'
                          : 'bg-slate-900/60 border-slate-600 text-slate-200 hover:border-emerald-300 hover:text-emerald-200'
                      }`}
                  >
                    <Target size={14} />
                    <span>Recalibrate baseline</span>
                  </motion.button>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-300/60 bg-emerald-400/10 text-emerald-200 text-[10px] tracking-[0.25em] uppercase">
                    <Brain size={16} />
                    <span>AI calibrated</span>
                  </div>
                </div>
              )}

              {/* Voice & Session report */}
              <div className="flex gap-2 mt-1">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97, y: 0 }}
                  onClick={() => setVoiceEnabled((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-[10px] tracking-[0.22em] uppercase text-slate-300 hover:border-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  {voiceEnabled ? (
                    <Volume2 size={14} className="text-emerald-300" />
                  ) : (
                    <VolumeX size={14} className="text-slate-500" />
                  )}
                  <span>Voice coach {voiceEnabled ? 'on' : 'muted'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97, y: 0 }}
                  onClick={handleOpenSummary}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-[10px] tracking-[0.22em] uppercase text-slate-300 hover:border-sky-300 hover:text-sky-200 transition-colors"
                >
                  <FileText size={14} />
                  <span>Session report</span>
                </motion.button>
              </div>

              {/* Connection & state badge */}
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] mt-1">
                <Wifi
                  size={14}
                  className={connected ? 'text-emerald-400' : 'text-rose-400'}
                />
                <span className="text-slate-300">
                  {connected ? 'System online' : 'Signal lost'}
                </span>
              </div>
              <div
                className={`mt-1 px-4 py-1.5 rounded-full border text-[10px] tracking-[0.25em] uppercase transition-all duration-300 text-center
                        ${
                          metrics.stress_level === 'HIGH'
                            ? 'border-rose-300 text-rose-200 bg-rose-500/10'
                            : 'border-emerald-300/60 text-emerald-200 bg-emerald-500/10'
                        }`}
              >
                {metrics.stress_level === 'HIGH'
                  ? 'Tension spike detected'
                  : 'Calm focus zone'}
              </div>
            </div>
          </div>

          {/* Strain banner */}
          <StrainBanner
            visible={showStrainBanner}
            level={metrics.stress_level}
          />

          {/* Middle: Orb + Session snapshot + Privacy */}
          <div className="mt-3 grid md:grid-cols-3 gap-4 items-stretch">
            <div className="md:col-span-2 flex items-center justify-center">
              <NeuroOrb
                stressLevel={metrics.stress_level}
                focusScore={focusScore}
              />
            </div>
            <div className="flex flex-col gap-3">
              <SessionInsights
                sessionStats={sessionStats}
                durationMs={sessionDurationMs}
              />
              <PrivacyCard />
            </div>
          </div>

          {/* Focus balance bar */}
          <div className="w-full flex flex-col gap-1 z-10 mt-2">
            <div className="flex justify-between text-xs font-medium tracking-[0.18em] opacity-80">
              <span
                className={
                  metrics.stress_level === 'HIGH'
                    ? 'text-rose-300'
                    : 'text-emerald-300'
                }
              >
                FOCUS BALANCE
              </span>
              <span className="flex items-center gap-2 text-slate-200">
                <span className="text-[9px] uppercase tracking-[0.24em] text-slate-400">
                  {focusDescriptor}
                </span>
                <span>{Math.round(focusScore)}%</span>
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-400 ease-out ${
                  focusScore < 50
                    ? 'bg-rose-400 shadow-[0_0_12px_#fb7185]'
                    : 'bg-emerald-300 shadow-[0_0_12px_#6ee7b7]'
                }`}
                style={{ width: `${focusScore}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* SMART BREAK + HEALTH SHIELD */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <SmartBreakRing
            charge={breakCharge}
            stress={stressScore}
            nextBreakSeconds={approxSecondsToBreak}
          />
          <HealthShield hp={shieldHp} stress={stressScore} />
        </motion.div>

        {/* DATA GRAPHS: EKG-style velocity + jitter */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Velocity as Bio-Rhythm EKG */}
          <motion.div
            layout
            className="p-6 border border-slate-800 rounded-xl bg-slate-900/90 backdrop-blur-md shadow-md relative overflow-hidden group"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 opacity-40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(248,113,113,0.12),transparent_55%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.8)_1px,transparent_1px)] bg-[size:20px_20px]" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.22em] font-semibold mb-1">
                  Bio‑Rhythm waveform
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl md:text-5xl font-semibold text-white">
                    <AnimatedNumber value={metrics.velocity} decimals={0} />
                  </p>
                  <p className="text-xs text-slate-400">px/sec</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Real‑time EKG‑style trace of cursor speed. Smooth, green
                  waves indicate flow; jagged red segments mark micro‑stress.
                </p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-full text-emerald-300 group-hover:bg-slate-700/80 transition-colors">
                <Zap size={22} />
              </div>
            </div>
            <div className="h-32 w-[110%] -ml-[5%] -mb-6 relative opacity-90">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <YAxis domain={[0, 2000]} hide />
                  <Line
                    type="monotone"
                    dataKey="velocity"
                    stroke={ekgStrokeColor}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
            </div>
          </motion.div>

          {/* Jitter graph */}
          <motion.div
            layout
            className={`p-6 border rounded-xl bg-slate-900/90 backdrop-blur-md shadow-md relative overflow-hidden group
                ${
                  metrics.stress_level === 'HIGH'
                    ? 'border-rose-300/60'
                    : 'border-slate-800 hover:border-rose-300/40'
                }`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-rose-300/90 text-[10px] uppercase tracking-[0.22em] font-semibold mb-1">
                  Path variability (jitter)
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl md:text-5xl font-semibold text-white">
                    <AnimatedNumber value={metrics.jitter} decimals={0} />
                  </p>
                  <p className="text-xs text-slate-400">index</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Increased jitter can reflect restlessness, overload or very
                  fragmented attention.
                </p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-full text-rose-300 group-hover:bg-rose-500/20 transition-colors">
                <Activity size={22} />
              </div>
            </div>
            <div className="h-32 w-[110%] -ml-[5%] -mb-6 relative opacity-90">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <YAxis domain={[0, 500]} hide />
                  <Line
                    type="monotone"
                    dataKey="jitter"
                    stroke="#fb7185"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </motion.div>

        {/* Wellness coach */}
        {wellnessCard && (
          <WellnessCoach
            card={wellnessCard}
            stressLevel={metrics.stress_level}
            focusScore={focusScore}
          />
        )}

        {/* Zen side widget (non-blocking breathing coach) */}
        <ZenWidget
          active={zenActive}
          secondsLeft={zenSeconds}
          onClose={() => setZenActive(false)}
        />

        {/* Session summary */}
        <SessionSummaryModal
          open={summaryOpen}
          snapshot={summarySnapshot}
          onClose={() => setSummaryOpen(false)}
          onNewSession={handleNewSession}
        />
      </motion.div>
    </div>
  );
}

export default App;
