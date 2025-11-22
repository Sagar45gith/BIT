from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import eventlet
import time
from tracker import NeuroTracker
from ai_engine import NeuroAI

app = Flask(__name__)
app.config['SECRET_KEY'] = 'neuro_secret'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

tracker = NeuroTracker()
ai = NeuroAI() 

# Global Flag to control calibration state
is_learning_mode = False

def data_stream_background_task():
    global is_learning_mode
    print("🚀 Data Stream & AI Engine Started...")
    
    while True:
        stats = tracker.get_latest_stats()
        vel = stats['velocity']
        jit = stats['jitter']
        
        # ONLY feed the AI if we are in "Learning Mode"
        if is_learning_mode:
            ai.add_data_point(vel, jit)
            
            # Check if we have enough data to finish calibration
            if ai.train_model():
                print("🤖 AI Model Calibrated Successfully!")
                is_learning_mode = False # Stop learning, start predicting
                socketio.emit('calibration_done')

        # Get Prediction (Only works if calibrated)
        stress_status = ai.predict_stress(vel, jit)
        
        packet = {
            "velocity": vel,
            "jitter": jit,
            "stress_level": "HIGH" if stress_status == -1 else "LOW",
            "ai_active": ai.is_calibrated,
            "learning_progress": len(ai.history_buffer) # Send progress to UI
        }
        
        socketio.emit('mouse_data', packet)
        socketio.sleep(0.05)

@socketio.on('start_calibration')
def handle_calibration_request():
    global is_learning_mode
    print("🔄 Manual Calibration Triggered by User")
    ai.reset() # Wipe old data
    is_learning_mode = True

@socketio.on('connect')
def handle_connect():
    print("✅ Client Connected")

if __name__ == '__main__':
    socketio.start_background_task(data_stream_background_task)
    socketio.run(app, host='0.0.0.0', port=5000)