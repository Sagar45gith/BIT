from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import eventlet
import time
import threading

# Import our tracker class
from tracker import NeuroTracker

# Initialize Flask and SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'neuro_secret'
CORS(app) # Allow React to connect
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Initialize Tracker Global Instance
tracker = NeuroTracker()

def data_stream_background_task():
    """
    Background thread that pushes data to the frontend constantly.
    """
    print("🚀 Data Stream Started...")
    while True:
        # Get fresh stats from our tracker script
        stats = tracker.get_latest_stats()
        
        # Emit to all connected clients (the React frontend)
        socketio.emit('mouse_data', stats)
        
        # Sleep to match approx 60 FPS (1/60 = ~0.016s)
        # We use eventlet.sleep to ensure non-blocking behavior
        socketio.sleep(0.05) 

@socketio.on('connect')
def handle_connect():
    print("✅ Client Connected (Frontend)")

@socketio.on('disconnect')
def handle_disconnect():
    print("❌ Client Disconnected")

@app.route('/')
def index():
    return "NeuroCursor Backend is Running! 🚀"

if __name__ == '__main__':
    # Start the background streaming task
    socketio.start_background_task(data_stream_background_task)
    
    # Run the server on port 5000
    print("⚡ Server starting on http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000)