import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Activity, Wifi, Zap, Target } from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:5000');
const GRAPH_LIMIT = 50;

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

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('mouse_data', (newData) => {
      setMetrics(newData);
      setGraphData(prev => {
        const newPoint = { velocity: newData.velocity, jitter: newData.jitter };
        const updated = [...prev, newPoint];
        if (updated.length > GRAPH_LIMIT) updated.shift(); 
        return updated;
      });
    });

    // Listen for backend telling us it's done
    socket.on('calibration_done', () => {
        setIsCalibrating(false);
    });

    return () => {
      socket.off('connect');
      socket.off('mouse_data');
      socket.off('calibration_done');
    };
  }, []);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    socket.emit('start_calibration');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neuro-base text-neuro-cyan p-4 font-mono">
      
      <div className="w-full max-w-5xl grid grid-cols-1 gap-6">
        
        {/* --- HEADER --- */}
        <div className={`w-full p-6 border rounded-lg transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-4
            ${metrics.stress_level === 'HIGH' 
                ? 'bg-neuro-red/10 border-neuro-red shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse-fast' 
                : 'bg-neuro-glass/50 border-neuro-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'}`}>
            
            <div>
                <h1 className="text-2xl font-bold tracking-widest text-white">NEURO_CURSOR</h1>
                <div className="flex items-center gap-2 text-xs mt-1 opacity-70">
                    <Wifi size={14} />
                    <span>{connected ? 'SYSTEM ONLINE' : 'DISCONNECTED'}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                
                {/* THE NEW BUTTON */}
                {!metrics.ai_active && (
                    <button 
                        onClick={handleCalibrate}
                        disabled={isCalibrating}
                        className={`flex items-center gap-2 px-4 py-2 rounded border font-bold transition-all
                        ${isCalibrating 
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 animate-pulse cursor-wait' 
                            : 'bg-neuro-cyan/20 border-neuro-cyan text-neuro-cyan hover:bg-neuro-cyan/40 hover:shadow-[0_0_15px_#06b6d4]'}`}
                    >
                        <Target size={18} />
                        {isCalibrating 
                            ? `LEARNING (${metrics.learning_progress}/50)` 
                            : "START CALIBRATION"}
                    </button>
                )}

                {/* Status Badge */}
                {metrics.ai_active && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded border border-green-500 bg-green-500/10 text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#4ade80]"></div>
                        <span className="text-sm font-bold">AI CALIBRATED</span>
                    </div>
                )}

                {/* Anomaly Badge */}
                {metrics.ai_active && (
                    <div className={`px-4 py-2 rounded border font-bold text-lg
                        ${metrics.stress_level === 'HIGH' ? 'border-neuro-red text-neuro-red bg-neuro-red/10' : 'border-neuro-glass text-gray-500 opacity-0'}`}>
                        {metrics.stress_level === 'HIGH' ? '⚠️ ANOMALY DETECTED' : ''}
                    </div>
                )}
            </div>
        </div>

        {/* --- GRAPHS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Velocity Module */}
            <div className="p-6 border border-neuro-cyan/20 rounded-lg bg-neuro-glass/30 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-neuro-cyan/60 text-xs uppercase tracking-wider">Cursor Velocity</p>
                        <p className="text-4xl font-bold text-white mt-1">{Math.round(metrics.velocity)}</p>
                    </div>
                    <Zap size={24} className="text-neuro-cyan" />
                </div>
                <div className="h-32 w-full bg-black/20 rounded overflow-hidden relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <YAxis domain={[0, 2000]} hide />
                            <Line type="monotone" dataKey="velocity" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Jitter Module */}
            <div className="p-6 border border-neuro-red/20 rounded-lg bg-neuro-glass/30 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-neuro-red/60 text-xs uppercase tracking-wider">Micro-Tremor (Jitter)</p>
                        <p className="text-4xl font-bold text-white mt-1">{Math.round(metrics.jitter)}</p>
                    </div>
                    <Activity size={24} className="text-neuro-red" />
                </div>
                <div className="h-32 w-full bg-black/20 rounded overflow-hidden relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <YAxis domain={[0, 400]} hide />
                            <Line type="monotone" dataKey="jitter" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;