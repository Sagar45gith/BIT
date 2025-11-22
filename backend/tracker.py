import time
import math
import threading
import numpy as np
from pynput import mouse, keyboard # <--- Added keyboard

# CONFIGURATION
DATA_BUFFER_SIZE = 50 
ANALYSIS_WINDOW = 10  

class NeuroTracker:
    def __init__(self):
        self.data_buffer = []
        self.lock = threading.Lock()
        
        # Metrics
        self.current_velocity = 0.0
        self.current_jitter = 0.0 
        self.last_move_time = time.time()

        # --- DEMO MODE ---
        self.simulate_stress = False
        self.kb_listener = keyboard.Listener(on_press=self.on_key_press)
        self.kb_listener.start()

        self.listener = mouse.Listener(on_move=self.on_move)
        self.listener.start()

    def on_key_press(self, key):
        try:
            # Press 's' to toggle Fake Stress Mode
            if hasattr(key, 'char') and key.char == 's':
                self.simulate_stress = not self.simulate_stress
                print(f"🔥 SIMULATION MODE: {'ON' if self.simulate_stress else 'OFF'}")
        except AttributeError:
            pass

    def on_move(self, x, y):
        current_time = time.time()
        with self.lock:
            self.last_move_time = current_time
            self.data_buffer.append((x, y, current_time))
            
            if len(self.data_buffer) > DATA_BUFFER_SIZE:
                self.data_buffer.pop(0)
            
            self.process_metrics()

    def calculate_distance(self, p1, p2):
        return math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)

    def process_metrics(self):
        if len(self.data_buffer) < ANALYSIS_WINDOW:
            return

        points = self.data_buffer[-ANALYSIS_WINDOW:]
        
        # Velocity
        p_new = points[-1]
        p_old = points[-2]
        dist = self.calculate_distance((p_old[0], p_old[1]), (p_new[0], p_new[1]))
        time_delta = p_new[2] - p_old[2]
        
        if time_delta > 0:
            self.current_velocity = dist / time_delta

        # Tortuosity (Jitter)
        path_length = 0
        for i in range(1, len(points)):
            path_length += self.calculate_distance(
                (points[i-1][0], points[i-1][1]), 
                (points[i][0], points[i][1])
            )

        start_point = points[0]
        end_point = points[-1]
        displacement = self.calculate_distance(
            (start_point[0], start_point[1]), 
            (end_point[0], end_point[1])
        )

        if displacement < 5:
            if path_length > 15: 
                self.current_jitter = 100.0 
            else:
                self.current_jitter = 0.0   
        else:
            ratio = path_length / displacement
            raw_jitter = (ratio - 1) * 300 
            self.current_jitter = min(raw_jitter, 500)

    def get_latest_stats(self):
        with self.lock:
            # --- DEMO CHEAT CODE ---
            if self.simulate_stress:
                return {
                    "velocity": np.random.uniform(800, 1200), # Fake high speed
                    "jitter": np.random.uniform(200, 400),    # Fake high tremor
                    "timestamp": time.time()
                }

            # Normal Logic
            if time.time() - self.last_move_time > 0.15:
                self.current_velocity = 0.0
                self.current_jitter = 0.0

            return {
                "velocity": round(self.current_velocity, 2),
                "jitter": round(self.current_jitter, 2),
                "timestamp": time.time()
            }
        
if __name__ == "__main__":
    print("🔴 NeuroTracker V2 (Tortuosity) Initialized...")
    tracker = NeuroTracker()
    try:
        while True:
            stats = tracker.get_latest_stats()
            if stats['velocity'] > 0:
                print(f"Vel: {stats['velocity']} | Jitter (Chaos): {stats['jitter']}")
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("Stop.")