import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Activity, Wifi, Zap, Target, Brain } from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';

// Connect to Backend
const socket = io('http://localhost:5000');
const GRAPH_LIMIT = 50;

function App() {
  // --- STATE ---
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
  
  // Track previous status to trigger voice only on CHANGE
  const prevStatusRef = useRef('LOW');

  // --- VOICE ASSISTANT (JARVIS) ---
  const speak = (text) => {
    // Cancel any current speech to avoid overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;  // Slightly faster
    utterance.pitch = 0.9; // Slightly lower (Robotic)
    utterance.volume = 1.0;

    // Try to find a good sci-fi voice (Google US or System Default)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  // --- SOCKET LOGIC ---
  useEffect(() => {
    socket.on('connect', () => {
        setConnected(true);
        console.log("✅ Connected");
    });
    
    socket.on('disconnect', () => setConnected(false));

    socket.on('mouse_data', (newData) => {
      setMetrics(newData);

      // Update Graphs
      setGraphData(prev => {
        const newPoint = { velocity: newData.velocity, jitter: newData.jitter };
        const updated = [...prev, newPoint];
        if (updated.length > GRAPH_LIMIT) updated.shift(); 
        return updated;
      });

      // VOICE TRIGGER: Check for Status Change (LOW -> HIGH)
      if (prevStatusRef.current === 'LOW' && newData.stress_level === 'HIGH') {
        speak("Warning. Biometric anomaly detected. Stress levels critical.");
      }
      // Optional: Voice on recovery (HIGH -> LOW)
      if (prevStatusRef.current === 'HIGH' && newData.stress_level === 'LOW') {
        speak("Stabilizing. Biometrics returning to baseline.");
      }

      // Update ref for next loop
      prevStatusRef.current = newData.stress_level;
    });

    // Calibration Finished Event
    socket.on('calibration_done', () => {
        setIsCalibrating(false);
        speak("Calibration complete. Artificial Intelligence is now armed.");
    });

    return () => {
      socket.off('connect');
      socket.off('mouse_data');
      socket.off('calibration_done');
    };
  }, []);

  // --- HANDLERS ---
  const handleCalibrate = () => {
    setIsCalibrating(true);
    speak("Initiating calibration sequence. Please move your mouse.");
    socket.emit('start_calibration');
  };

  // Calculate Focus Score (Frontend logic: Inverse of Jitter)
  // 0 jitter = 100% focus. 400 jitter = 0% focus.
  const focusScore = Math.max(0, Math.min(100, 100 - (metrics.jitter / 3)));

  return (
    <div className="min-h-screen flex items-center justify-center bg-neuro-base text-neuro-cyan p-4 font-mono selection:bg-neuro-cyan selection:text-black">
      
      <div className="w-full max-w-5xl flex flex-col gap-6">
        
        {/* --- MAIN CONTROL HUD --- */}
        <div className={`w-full p-6 border rounded-lg transition-all duration-500 flex flex-col gap-6 relative overflow-hidden
            ${metrics.stress_level === 'HIGH' 
                ? 'bg-neuro-red/5 border-neuro-red shadow-[0_0_50px_rgba(244,63,94,0.2)]' 
                : 'bg-neuro-glass/60 border-neuro-cyan/30 shadow-[0_0_20px_rgba(6,182,212,0.05)]'}`}>
            
            {/* Header Row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 z-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-[0.2em] text-white drop-shadow-lg">NEURO_CURSOR</h1>
                    <div className="flex items-center gap-2 text-xs mt-1 opacity-70 uppercase tracking-wider">
                        <Wifi size={14} className={connected ? "text-green-400" : "text-red-500"} />
                        <span>{connected ? 'System Online' : 'Signal Lost'}</span>
                        <span className="mx-2">|</span>
                        <span>v1.0.4 Stable</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* CALIBRATE BUTTON */}
                    {!metrics.ai_active && (
                        <button 
                            onClick={handleCalibrate}
                            disabled={isCalibrating}
                            className={`flex items-center gap-2 px-6 py-3 rounded border font-bold transition-all duration-300
                            ${isCalibrating 
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 animate-pulse cursor-wait' 
                                : 'bg-neuro-cyan/10 border-neuro-cyan text-neuro-cyan hover:bg-neuro-cyan/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'}`}
                        >
                            <Target size={20} />
                            {isCalibrating 
                                ? `LEARNING [${metrics.learning_progress}/50]` 
                                : "INITIALIZE AI"}
                        </button>
                    )}

                    {/* AI ACTIVE BADGE */}
                    {metrics.ai_active && (
                        <div className="flex items-center gap-3 px-5 py-3 rounded border border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                            <Brain size={20} />
                            <span className="font-bold tracking-wide">AI CALIBRATED</span>
                        </div>
                    )}

                    {/* ANOMALY WARNING */}
                    <div className={`px-6 py-3 rounded border font-bold text-lg tracking-widest transition-all duration-300
                        ${metrics.stress_level === 'HIGH' 
                            ? 'border-neuro-red text-neuro-red bg-neuro-red/20 shadow-[0_0_20px_rgba(244,63,94,0.5)] opacity-100 scale-110' 
                            : 'border-transparent text-transparent bg-transparent opacity-0'}`}>
                        ⚠️ ANOMALY
                    </div>
                </div>
            </div>

            {/* FOCUS INTEGRITY BAR */}
            <div className="w-full flex flex-col gap-1 z-10">
                <div className="flex justify-between text-xs font-bold tracking-widest opacity-80">
                    <span className={metrics.stress_level === 'HIGH' ? 'text-neuro-red' : 'text-neuro-cyan'}>FOCUS INTEGRITY</span>
                    <span className="text-white">{Math.round(focusScore)}%</span>
                </div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                    <div 
                        className={`h-full transition-all duration-300 ease-out ${focusScore < 50 ? 'bg-neuro-red shadow-[0_0_10px_#f43f5e]' : 'bg-neuro-cyan shadow-[0_0_10px_#06b6d4]'}`}
                        style={{ width: `${focusScore}%` }}
                    ></div>
                </div>
            </div>

            {/* Background Pulse Effect when Stressed */}
            {metrics.stress_level === 'HIGH' && (
                <div className="absolute inset-0 bg-neuro-red/10 animate-pulse z-0 pointer-events-none"></div>
            )}
        </div>

        {/* --- DATA GRIDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* VELOCITY CARD */}
            <div className="p-6 border border-neuro-cyan/20 rounded-lg bg-neuro-glass/40 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-neuro-cyan/40 transition-colors">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-neuro-cyan/60 text-xs uppercase tracking-widest font-bold mb-1">Kinetic Velocity</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-5xl font-bold text-white font-mono">{Math.round(metrics.velocity)}</p>
                            <p className="text-xs text-gray-400">px/sec</p>
                        </div>
                    </div>
                    <div className="p-3 bg-neuro-cyan/10 rounded-full text-neuro-cyan group-hover:bg-neuro-cyan/20 transition-colors">
                        <Zap size={24} />
                    </div>
                </div>
                {/* Graph */}
                <div className="h-36 w-[110%] -ml-[5%] -mb-6 relative opacity-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <YAxis domain={[0, 2000]} hide />
                            <Line 
                                type="monotone" 
                                dataKey="velocity" 
                                stroke="#06b6d4" 
                                strokeWidth={3} 
                                dot={false} 
                                isAnimationActive={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    {/* Gradient Fade at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neuro-glass/40 to-transparent"></div>
                </div>
            </div>

            {/* JITTER CARD */}
            <div className={`p-6 border rounded-lg bg-neuro-glass/40 backdrop-blur-md shadow-lg relative overflow-hidden group transition-colors
                ${metrics.stress_level === 'HIGH' ? 'border-neuro-red/50' : 'border-neuro-red/20 hover:border-neuro-red/40'}`}>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-neuro-red/60 text-xs uppercase tracking-widest font-bold mb-1">Path Tortuosity (Jitter)</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-5xl font-bold text-white font-mono">{Math.round(metrics.jitter)}</p>
                            <p className="text-xs text-gray-400">index</p>
                        </div>
                    </div>
                    <div className="p-3 bg-neuro-red/10 rounded-full text-neuro-red group-hover:bg-neuro-red/20 transition-colors">
                        <Activity size={24} />
                    </div>
                </div>
                {/* Graph */}
                <div className="h-36 w-[110%] -ml-[5%] -mb-6 relative opacity-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <YAxis domain={[0, 500]} hide />
                            <Line 
                                type="monotone" 
                                dataKey="jitter" 
                                stroke="#f43f5e" 
                                strokeWidth={3} 
                                dot={false} 
                                isAnimationActive={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 bg-gradient-to-t from-neuro-glass/40 to-transparent"></div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

export default App;