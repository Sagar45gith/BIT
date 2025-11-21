import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Activity, Wifi } from 'lucide-react';

// Connect to our Flask Backend
const socket = io('http://localhost:5000');

function App() {
  const [data, setData] = useState({ velocity: 0, jitter: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log("✅ Connected to Neuro Backend");
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('mouse_data', (newData) => {
      setData(newData);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('mouse_data');
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neuro-base text-neuro-cyan">
      
      {/* Main HUD Container */}
      <div className="relative w-full max-w-md p-8 border border-neuro-cyan/30 rounded-lg bg-neuro-glass/50 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-neuro-cyan/20 pb-4">
          <h1 className="text-2xl font-bold tracking-widest">NEURO_CURSOR</h1>
          <div className={`flex items-center gap-2 ${connected ? 'text-green-400' : 'text-red-500'}`}>
            <Wifi size={18} />
            <span className="text-xs">{connected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* Velocity Module */}
          <div className="flex flex-col items-center p-4 border border-neuro-cyan/20 rounded bg-black/40">
            <span className="text-xs text-neuro-cyan/60 uppercase tracking-wider mb-2">Velocity</span>
            <span className="text-4xl font-mono font-bold text-white">
              {Math.round(data.velocity)}
            </span>
            <span className="text-xs text-gray-500 mt-1">px/s</span>
          </div>

          {/* Jitter Module */}
          <div className="flex flex-col items-center p-4 border border-neuro-red/20 rounded bg-black/40">
            <span className="text-xs text-neuro-red/60 uppercase tracking-wider mb-2">Jitter</span>
            <div className="flex items-center gap-2">
                <Activity size={20} className="text-neuro-red" />
                <span className="text-4xl font-mono font-bold text-white">
                {Math.round(data.jitter)}
                </span>
            </div>
            <span className="text-xs text-gray-500 mt-1">micro-tremor</span>
          </div>

        </div>

        {/* Status Footer */}
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">System Status: <span className="text-green-400">MONITORING</span></p>
        </div>
      </div>
    </div>
  );
}

export default App;