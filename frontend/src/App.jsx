import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
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
  FileText
} from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';

// We need to talk to the Python server running locally on port 5000 to get the mouse analysis
const socket = io('http://localhost:5000');

// This keeps our real-time graph from getting too crowded and slowing things down
const GRAPH_LIMIT = 50;

// Just a quick utility to grab a random string from an array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// These are the scripts the AI uses to talk to the user. We split them up based on how stressed the user looks.
// First, lines for when the user is clearly stressing out (high velocity/jitter)
const HIGH_STRESS_VOICE_LINES = [
  "Your cursor looks a bit tense. Unclench your jaw, let your shoulders drop and take one slow breath in, one long breath out.",
  "I'm seeing faster, less steady movements. Rest your hands on the desk for ten seconds and soften your grip on the mouse.",
  "Micro‑stress detected. Look away from the screen, roll your shoulders once or twice, then come back to your work."
];

// Lines for when the user manages to calm down after a spike
const RECOVERY_VOICE_LINES = [
  "Your movements look steadier again. Stay with this softer pace and notice your breathing.",
  "You're back in a calmer focus zone. This is a good time for deep, uninterrupted work.",
  "Cursor patterns are smoother now. Keep your shoulders relaxed and let your breath stay slow."
];

// Reinforcement lines for when they are cruising along nicely in a flow state
const CALM_FOCUS_VOICE_LINES = [
  "You’re in a stable focus window. If possible, mute one distraction and stay with your current task.",
  "Cursor movement looks calm and consistent. This is a great moment for meaningful, concentrated work.",
  "You're in a balanced state. Keep your posture comfortable, and let your breathing stay unforced."
];

// These are the tips that appear on the dashboard card. They rotate based on context.
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

// This component is the visual heartbeat of the app. It expands and turns red when stressed, shrinks and turns green when calm.
function NeuroOrb({ stressLevel, focusScore }) {
  const tension = Math.max(0, 100 - focusScore); // Normalized to 0–100
  const scale = 1 + tension / 350; // Subtle scaling, we don't want it to look too wild
  const isHigh = stressLevel === 'HIGH';

  // Color logic: Rose for stress, Emerald for calm
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

// This panel shows the user the raw numbers so they know we aren't making this up
function SessionInsights({ sessionStats, durationMs }) {
  const minutesHigh = sessionStats.highMs / 60000;
  const totalMinutes = durationMs / 60000 || 0.01;
  const avgFocus = sessionStats.samples ? sessionStats.avgFocus : 100;
  
  // Calculate how much of the session was spent in fight or flight mode
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

// This is the card that displays the context-aware tips we defined at the top
function WellnessCoach({ card, stressLevel, focusScore }) {
  const isHigh = stressLevel === 'HIGH';

  return (
    <div
      className={`p-6 border rounded-xl bg-slate-900/80 backdrop-blur-md shadow-lg relative overflow-hidden
      ${isHigh ? 'border-rose-300/50' : 'border-emerald-300/40'}`}
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

        {/* The breathing ring visualization */}
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

      {/* Subtle background glow for atmosphere */}
      <div
        className={`absolute -right-24 -bottom-24 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none
        ${isHigh ? 'bg-rose-500/40' : 'bg-emerald-400/40'}`}
      />
    </div>
  );
}

// It's important to reassure the user that we aren't spying on them
function PrivacyCard() {
  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md text-left space-y-2">
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
    </div>
  );
}

// The Panic Button (sort of). If stress gets too high, this pops up bottom-left to guide a quick 60-second reset.
function GuidedReset({ resetRemaining, onStop }) {
  const total = 60;
  const progress = ((total - resetRemaining) / total) * 100;

  return (
    <div className="fixed bottom-4 left-4 z-30">
      <div className="p-4 rounded-xl border border-emerald-300/50 bg-slate-900/95 shadow-2xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-full breath-ring flex items-center justify-center text-[10px] text-emerald-50">
          <span className="text-center leading-tight">
            {resetRemaining}s
            <br />
            reset
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-emerald-200">
            Micro‑break in progress
          </p>
          <p className="text-[11px] text-slate-300 max-w-xs">
            Follow the breathing ring. Inhale as it expands, exhale as it
            softens. Let your hands rest lightly on the desk.
          </p>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-300 transition-all duration-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={onStop}
            className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 hover:text-slate-200"
          >
            Skip reset
          </button>
        </div>
      </div>
    </div>
  );
}

// This is the End-of-Session Report that shows the user how they did and provides a copy-paste summary
function SessionSummaryModal({ open, snapshot, onClose, onNewSession }) {
  if (!open || !snapshot) return null;

  const { stats, durationMs } = snapshot;
  const totalMinutes = durationMs / 60000 || 0.01;
  const highMinutes = stats.highMs / 60000;
  const highFraction =
    durationMs > 0 ? stats.highMs / durationMs : 0;
  const avgFocus = stats.samples ? stats.avgFocus : 100;

  // Simple algorithm to give them a "Wellbeing Score"
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
    } catch (e) {
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

// Here is where we tie everything together in the main app component
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

  // State for the guided reset (breathing) widget
  const [resetActive, setResetActive] = useState(false);
  const [resetRemaining, setResetRemaining] = useState(0);

  // Accumulating stats for the entire session
  const [sessionStats, setSessionStats] = useState({
    microStressEvents: 0,
    highMs: 0,
    samples: 0,
    avgFocus: 100
  });

  // Modal visibility states
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summarySnapshot, setSummarySnapshot] = useState(null);

  // We use refs here to track state inside the Socket callback without triggering a million re-renders or stale closures
  const prevStatusRef = useRef('LOW');
  const lastVoiceTimeRef = useRef(0);
  const stateChangeTimeRef = useRef(Date.now());
  const lastPacketTimeRef = useRef(null);
  const runningFocusSumRef = useRef(0);
  const voiceEnabledRef = useRef(true);
  const lastMovementTimeRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // This text-to-Speech Handler tries to find a decent Google voice, otherwise falls back to default
  const speak = (text) => {
    if (!voiceEnabledRef.current) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Don't queue up multiple sentences

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

  // Calculate Focus Score purely from jitter (0 jitter = 100% focus)
  const focusScore = Math.max(0, Math.min(100, 100 - metrics.jitter / 3));

  // Timer logic for the guided breathing reset
  useEffect(() => {
    if (!resetActive) return;
    if (resetRemaining <= 0) {
      setResetActive(false);
      return;
    }
    const id = setTimeout(() => {
      setResetRemaining((r) => r - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [resetActive, resetRemaining]);

  // This effect is the brain of the client. It handles the data stream, updates graphs, calculates stats, and decides when the AI needs to speak up.
  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('✅ Connected to Neural Backend');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('mouse_data', (newData) => {
      const now = Date.now();
      setMetrics(newData);

      // Update the live graphs
      setGraphData((prev) => {
        const newPoint = { velocity: newData.velocity, jitter: newData.jitter };
        const updated = [...prev, newPoint];
        if (updated.length > GRAPH_LIMIT) updated.shift();
        return updated;
      });

      // Calculate local focus score for this specific data point
      const localFocusScore = Math.max(
        0,
        Math.min(100, 100 - newData.jitter / 3)
      );

      // Check if the user is actually working or just AFK
      const hasSignificantMovement =
        newData.velocity > 40 || newData.jitter > 40;
      if (hasSignificantMovement) {
        lastMovementTimeRef.current = now;
      }
      const idleForLong = now - lastMovementTimeRef.current > 5000; // >5s no real movement

      // Calculate session stats time-deltas
      const prevStatus = prevStatusRef.current;
      const lastTime = lastPacketTimeRef.current;
      const dt = lastTime ? now - lastTime : 0;

      setSessionStats((prevStats) => {
        // Count how many times we flipped from Low -> High
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

      // Smart voice logic: We only speak if the user is actually moving the mouse, and we use cooldowns so we don't annoy them.
      const timeSinceVoice = now - lastVoiceTimeRef.current;

      if (!idleForLong) {
        if (newData.stress_level !== prevStatus) {
          const previousStateDuration = now - stateChangeTimeRef.current;
          stateChangeTimeRef.current = now;

          // Case 1: User just entered HIGH stress zone
          if (
            newData.stress_level === 'HIGH' &&
            timeSinceVoice > 45_000
          ) {
            speak(pickRandom(HIGH_STRESS_VOICE_LINES));
            lastVoiceTimeRef.current = now;

            // If it's a spike, offer the breathing exercise immediately
            if (!resetActive) {
              setResetActive(true);
              setResetRemaining(60);
            }
          }

          // Case 2: User just recovered (HIGH -> LOW) after a long bout of stress
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
          // Case 3: User has been in HIGH stress for a LONG time so we nag them gently
          if (newData.stress_level === 'HIGH') {
            const timeInHigh = now - stateChangeTimeRef.current;
            if (timeInHigh > 120_000 && timeSinceVoice > 90_000) {
              speak(pickRandom(HIGH_STRESS_VOICE_LINES));
              lastVoiceTimeRef.current = now;
              stateChangeTimeRef.current = now;

              if (!resetActive) {
                setResetActive(true);
                setResetRemaining(60);
              }
            }
          }

          // Case 4: User has been in LOW stress or Flow State for a long time
          if (newData.stress_level === 'LOW' && localFocusScore > 70) {
            const timeInLow = now - stateChangeTimeRef.current;
            if (timeInLow > 120_000 && timeSinceVoice > 120_000) {
              speak(pickRandom(CALM_FOCUS_VOICE_LINES));
              lastVoiceTimeRef.current = now;
              stateChangeTimeRef.current = now;
            }
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

  // Swap out the Wellness Coach card whenever the stress state flips
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

  // Open the end-of-session summary
  const handleOpenSummary = () => {
    const now = Date.now();
    const durationMs = now - sessionStartRef.current;
    setSummarySnapshot({
      stats: sessionStats,
      durationMs
    });
    setSummaryOpen(true);
  };

  // Reset everything for a fresh start
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

  // Trigger a new calibration with the backend
  const handleRecalibrate = () => {
    setIsCalibrating(true);
    speak(
      'Recalibrating to your current style. For the next few seconds, move your mouse as you normally would.'
    );
    socket.emit('start_calibration');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-50 flex items-center justify-center px-4 py-6 selection:bg-emerald-200 selection:text-slate-900">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* Main Dashboard Container */}
        <div
          className={`w-full p-6 border rounded-2xl transition-all duration-500 flex flex-col gap-5 relative overflow-hidden bg-slate-900/90
            ${
              metrics.stress_level === 'HIGH'
                ? 'border-rose-300/40 shadow-[0_0_40px_rgba(248,113,113,0.20)]'
                : 'border-slate-800 shadow-[0_0_36px_rgba(15,23,42,0.9)]'
            }`}
        >
          {/* Decorative gradient glow in the corners */}
          <div className="pointer-events-none absolute -top-32 -right-32 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 w-72 h-72 bg-sky-500/5 blur-3xl rounded-full" />

          {/* Header Row: Title and Status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
            <div className="text-left space-y-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-[0.18em] text-white">
                NEURO_CURSOR
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[10px] mt-1 opacity-80 uppercase tracking-[0.25em]">
                <Wifi
                  size={14}
                  className={connected ? 'text-emerald-400' : 'text-rose-400'}
                />
                <span>{connected ? 'System online' : 'Signal lost'}</span>
                <span className="mx-1">•</span>
                <span>AI‑driven digital wellbeing monitor</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 max-w-md leading-relaxed">
                Uses tiny changes in your mouse path as a gentle signal of
                cognitive load and micro‑stress. Designed to support digital
                wellbeing, focus hygiene and ergonomic awareness — not as a
                medical device or diagnostic tool.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Calibration Button: Init vs Recalibrate */}
              {!metrics.ai_active && (
                <button
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
                </button>
              )}

              {metrics.ai_active && (
                <div className="flex gap-2">
                  <button
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
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-300/60 bg-emerald-400/10 text-emerald-200 text-[10px] tracking-[0.25em] uppercase">
                    <Brain size={16} />
                    <span>AI calibrated</span>
                  </div>
                </div>
              )}

              {/* Toggle Voice & View Summary */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setVoiceEnabled((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-[10px] tracking-[0.22em] uppercase text-slate-300 hover:border-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  {voiceEnabled ? (
                    <Volume2 size={14} className="text-emerald-300" />
                  ) : (
                    <VolumeX size={14} className="text-slate-500" />
                  )}
                  <span>Voice coach {voiceEnabled ? 'on' : 'muted'}</span>
                </button>
                <button
                  onClick={handleOpenSummary}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/60 text-[10px] tracking-[0.22em] uppercase text-slate-300 hover:border-sky-300 hover:text-sky-200 transition-colors"
                >
                  <FileText size={14} />
                  <span>Session report</span>
                </button>
              </div>

              {/* Live State Badge */}
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

          {/* Central Visuals: The Orb, The Stats, The Privacy Info */}
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

          {/* Focus Balance Bar visualizing jitter/stability */}
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
        </div>

        {/* Live Data Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Velocity Graph */}
          <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/90 backdrop-blur-md shadow-md relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.22em] font-semibold mb-1">
                  Cursor velocity
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl md:text-5xl font-semibold text-white">
                    {Math.round(metrics.velocity)}
                  </p>
                  <p className="text-xs text-slate-400">px/sec</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Higher spikes can signal rapid scanning, rushing or
                  multitasking under pressure.
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
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Jitter Graph */}
          <div
            className={`p-6 border rounded-xl bg-slate-900/90 backdrop-blur-md shadow-md relative overflow-hidden group
                ${
                  metrics.stress_level === 'HIGH'
                    ? 'border-rose-300/60'
                    : 'border-slate-800 hover:border-rose-300/40'
                }`}
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-rose-300/90 text-[10px] uppercase tracking-[0.22em] font-semibold mb-1">
                  Path variability (jitter)
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl md:text-5xl font-semibold text-white">
                    {Math.round(metrics.jitter)}
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
          </div>
        </div>

        {/* Wellness Coach Card */}
        {wellnessCard && (
          <WellnessCoach
            card={wellnessCard}
            stressLevel={metrics.stress_level}
            focusScore={focusScore}
          />
        )}

        {/* Guided Reset Breathing Exercise */}
        {resetActive && (
          <GuidedReset
            resetRemaining={resetRemaining}
            onStop={() => setResetActive(false)}
          />
        )}

        {/* Session Summary Modal */}
        <SessionSummaryModal
          open={summaryOpen}
          snapshot={summarySnapshot}
          onClose={() => setSummaryOpen(false)}
          onNewSession={handleNewSession}
        />
      </div>
    </div>
  );
}

export default App;