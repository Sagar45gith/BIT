import numpy as np
from sklearn.ensemble import IsolationForest
import threading

class NeuroAI:
    def __init__(self):
        self.history_buffer = []
        self.is_calibrated = False
        self.lock = threading.Lock()
        self.model = IsolationForest(contamination=0.05, random_state=42)

    def reset(self):
        """
        Clears previous learning to start fresh.
        """
        with self.lock:
            self.history_buffer = []
            self.is_calibrated = False
            print("🧠 AI Brain Wiped. Ready for new calibration.")

    def add_data_point(self, velocity, jitter):
        with self.lock:
            # Ignore "Statues" (No movement)
            if velocity < 10:
                return
            
            self.history_buffer.append([velocity, jitter])
            if len(self.history_buffer) > 1000:
                self.history_buffer.pop(0)

    def train_model(self):
        with self.lock:
            # STRICT RULE: Need 50 valid movement points (~2-3 seconds of movement)
            if len(self.history_buffer) < 50:
                return False 
            
            try:
                X = np.array(self.history_buffer)
                self.model.fit(X)
                self.is_calibrated = True
                return True
            except Exception as e:
                print(f"AI Error: {e}")
                return False

    def predict_stress(self, velocity, jitter):
        if not self.is_calibrated:
            return 1 
        
        # Sanity Gate: Ignore low jitter
        if jitter < 80:
            return 1 

        try:
            prediction = self.model.predict([[velocity, jitter]])
            return prediction[0]
        except:
            return 1