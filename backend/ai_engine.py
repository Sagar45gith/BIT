import numpy as np
from sklearn.ensemble import IsolationForest
import threading

class NeuroAI:
    def __init__(self):
        # We need a buffer of history to "train" the model
        self.history_buffer = []
        self.is_calibrated = False
        self.lock = threading.Lock()
        
        # The Brain: Isolation Forest
        # contamination=0.1 means we expect ~10% of data to be "Stress" spikes
        self.model = IsolationForest(contamination=0.1, random_state=42)

    def add_data_point(self, velocity, jitter):
        """
        Feeds live data into the AI.
        """
        with self.lock:
            # We ignore idle moments (0, 0) so the AI doesn't learn "sleeping" as normal behavior
            if velocity < 1 and jitter < 1:
                return

            self.history_buffer.append([velocity, jitter])
            
            # Keep buffer size manageable (last 1000 movements)
            if len(self.history_buffer) > 1000:
                self.history_buffer.pop(0)

    def train_model(self):
        """
        Called periodically to re-learn the user's baseline.
        """
        with self.lock:
            if len(self.history_buffer) < 50:
                return False # Not enough data yet
            
            X = np.array(self.history_buffer)
            self.model.fit(X)
            self.is_calibrated = True
            return True

    def predict_stress(self, velocity, jitter):
        """
        Returns:
        1 = Normal (In the Flow)
        -1 = Anomaly (Stress/Burnout detected)
        """
        if not self.is_calibrated:
            return 1 # Default to normal until we know better
        
        prediction = self.model.predict([[velocity, jitter]])
        return prediction[0]