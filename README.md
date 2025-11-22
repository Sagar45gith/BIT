````markdown
# NeuroCursor – AI-Powered Digital Phenotyping for Preventative Health

NeuroCursor is an **AI‑driven preventative health tool** that reads subtle changes in your **mouse movement patterns** (digital phenotyping) to surface:

- Micro‑stress and early burnout signals  
- Cognitive load / focus quality  
- Potential RSI (Repetitive Strain Injury) risk related to erratic, high‑load cursor use  

It runs **entirely on your local device**, in real time, and never reads screen content or keystrokes.  
The UI is designed to feel like a **biometric command center** from a sci‑fi movie, while remaining clean and sober enough for healthcare and wellness use.

> ⚠️ **Not a medical device.** > NeuroCursor is a wellbeing and ergonomics awareness tool. It does not diagnose, treat, or cure any condition.

---

## Table of Contents

1. [Features](#features)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Repository Structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Backend Setup (Flask + Socket.IO)](#backend-setup-flask--socketio)
7. [Frontend Setup (Vite + React)](#frontend-setup-vite--react--tailwind--framer-motion)
8. [Running the Full System](#running-the-full-system)
9. [How NeuroCursor Works](#how-neurocursor-works)
10. [UI Tour](#ui-tour)
11. [Configuration & Customization](#configuration--customization)
12. [Troubleshooting](#troubleshooting)
13. [Security, Privacy & Ethics](#security-privacy--ethics)
14. [Hackathon Demo Script](#hackathon-demo-script-23-minutes)

---

## Features

### Real-Time Digital Phenotyping
- **Mouse Tracking:** Tracks movement in real time using `pynput`.
- **Metrics Computed:**
  - **Velocity** (px/sec): How fast you’re moving.
  - **Jitter / Path Variability:** How erratic your path is.
- **ML Analysis:** Uses an **Isolation Forest** (unsupervised ML) to learn your personal baseline and flag deviant patterns as potential micro‑stress.

### Biometric Command Center UI
Built with **React + Tailwind + Framer Motion + Recharts**:
- **Bio‑Rhythm EKG Waveform:** EKG‑style live waveform of cursor velocity. (Green = Flow, Red = Tension).
- **Smart Break (Dynamic Pomodoro Ring):** Circular workload gauge that fills faster under higher stress to estimate time until the next recommended micro‑break.
- **Gamified Health Shield:** A “Health HP” bar that **regenerates** with calm, efficient movement and **depletes** under erratic behavior.
- **Zen Breathing Widget (Non‑Blocking):**
  - A bottom‑right side widget (never full‑screen) that appears during high strain.
  - Animated circle guides **4s inhale / 6s exhale** cycles.

### AI Wellbeing Coach
- **Voice Feedback:** Uses **Web Speech API** to provide contextual lines for entering stress, recovering, or sustaining focus.
- **Strict Idle Detection:** If no mouse movement is detected for a few seconds, **no voice feedback** is played. Coaching happens only when active.

### Session Analytics & Reporting
- **Tracks:** Total micro‑stress events, time spent in high load, average focus score, and nervous system load index.
- **End-of-Session Summary:** Displays a “Digital Wellbeing Score” and an AI‑generated textual insight. Includes a 1‑click **Copy summary** button.

---

## System Architecture

```text
+--------------------------+        Socket.IO        +------------------------------+
|        Frontend          | <--------------------> |           Backend            |
| (Vite + React + Tailwind)|                        |   (Flask + Socket.IO + ML)   |
+--------------------------+                        +------------------------------+
           |                                                        |
           |                                                        |
     Real-time UI:                                      Mouse movement capture:
  - EKG waveform (Recharts)                              - pynput mouse listener
  - Smart Break ring (Framer Motion)                     - velocity & jitter metrics
  - Health Shield HP                                     - IsolationForest (scikit-learn)
  - Zen breathing widget                                            |
           |                                                        |
           +--------------------- Real-time metrics ---------------+
````

-----

## Tech Stack

**Backend**

  - **Python 3.9+**
  - **Flask & Flask-SocketIO:** Real-time communication.
  - **Pynput:** Low-level mouse hook for tracking coordinates.
  - **Scikit-learn:** Isolation Forest for anomaly detection.
  - **NumPy/Pandas:** Data processing.

**Frontend**

  - **React (Vite):** Fast frontend tooling.
  - **Tailwind CSS:** Styling and layout.
  - **Framer Motion:** Smooth, sci-fi interface animations.
  - **Recharts:** Real-time EKG visualization.
  - **Web Speech API:** Text-to-Speech synthesis.

-----

## Repository Structure

```bash
NeuroCursor/
├── backend/
│   ├── app.py                 # Main entry point, SocketIO server
│   ├── ml_model.py            # Isolation Forest logic
│   ├── mouse_listener.py      # Pynput thread handling
│   ├── requirements.txt       # Python dependencies
│   └── utils.py               # Helper functions for signal processing
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EKGMonitor.jsx
│   │   │   ├── HealthShield.jsx
│   │   │   ├── ZenWidget.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── hooks/             # Custom hooks for socket connection
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

-----

## Prerequisites

  - **Node.js** (v16 or higher)
  - **Python** (v3.8 or higher)
  - **OS:** Windows, macOS, or Linux (Note: Linux may require specific display server permissions for `pynput`).

-----

## Backend Setup (Flask + Socket.IO)

1.  Navigate to the backend directory:

    ```bash
    cd backend
    ```

2.  Create a virtual environment:

    ```bash
    python -m venv venv
    # Windows:
    venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```

3.  Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4.  Start the Flask server:

    ```bash
    python app.py
    ```

    *The server typically runs on `http://localhost:5000`.*

-----

## Frontend Setup (Vite + React + Tailwind + Framer Motion)

1.  Open a new terminal and navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm run dev
    ```

    *The frontend typically runs on `http://localhost:5173`.*

-----

## Running the Full System

1.  Ensure the **Backend** is running in Terminal 1.
2.  Ensure the **Frontend** is running in Terminal 2.
3.  Open your browser to the local host URL provided by Vite (usually `http://localhost:5173`).
4.  Move your mouse\! You should immediately see the EKG waveform react to your speed and the Health Shield fluctuate based on movement consistency.

-----

## How NeuroCursor Works

1.  **Data Capture:** The Python backend hooks into the OS mouse events. It samples coordinates (X, Y) at a high frequency.
2.  **Feature Extraction:** It calculates Euclidean distance (velocity) and variance in direction (jitter) over sliding windows (e.g., 0.5s).
3.  **Inference:** The Isolation Forest model evaluates if the current movement window deviates significantly from "calm usage."
4.  **Transmission:** Scores (Stress Level, Velocity, HP Delta) are emitted via WebSocket to the React frontend.
5.  **Feedback:** The frontend visualizes this data and triggers the Voice Coach or Zen Widget if thresholds are crossed.

-----

## UI Tour

1.  **The Dashboard:** The main screen showing the EKG line and Health Shield.
2.  **The Ring:** Observe the circular progress bar. If you move erratically, it fills up red (indicating a need for a break). If you move smoothly, it stays blue/green.
3.  **Zen Mode:** When stress peaks, look at the bottom right. A breathing guide overlays the screen non-intrusively.
4.  **End Session:** Click "Finish Session" to see your aggregated stats and AI summary.

-----

## Configuration & Customization

You can tweak sensitivity settings in `backend/config.py` (or `app.py` depending on implementation):

  - `SAMPLING_RATE`: How often mouse position is polled.
  - `STRESS_THRESHOLD`: The anomaly score cutoff for triggering "High Stress."
  - `IDLE_TIMEOUT`: Seconds of inactivity before coaching is muted.

-----

## Troubleshooting

  - **Mac OS Input Monitoring:** If the backend crashes or fails to detect movement, go to `System Settings > Privacy & Security > Input Monitoring` and allow your Terminal/IDE.
  - **Socket Connection Errors:** Ensure the frontend `socket` definition points to `http://localhost:5000` (or your backend port).
  - **CORS Issues:** If the frontend cannot talk to the backend, check the `CORS` configuration in `app.py`.

-----

## Security, Privacy & Ethics

  - **Local Execution:** All processing happens on `localhost`. No data is sent to the cloud.
  - **No Content Logging:** We record *how* the mouse moves, not *what* is clicked. No screenshots, no keylogging.
  - **Session Volatility:** Data is cleared from memory when the session ends or the server restarts.

-----
```
```
