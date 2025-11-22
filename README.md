```markdown
# NeuroCursor – AI-Powered Digital Phenotyping for Preventative Health

NeuroCursor is an **AI‑driven preventative health tool** that reads subtle changes in your **mouse movement patterns** (digital phenotyping) to surface:

- Micro‑stress and early burnout signals  
- Cognitive load / focus quality  
- Potential RSI (Repetitive Strain Injury) risk related to erratic, high‑load cursor use  

It runs **entirely on your local device**, in real time, and never reads screen content or keystrokes.  
The UI is designed to feel like a **biometric command center** from a sci‑fi movie, while remaining clean and sober enough for healthcare and wellness use.

> ⚠️ **Not a medical device.**  
> NeuroCursor is a wellbeing and ergonomics awareness tool. It does not diagnose, treat or cure any condition.

---

## Table of Contents

1. [Features](#features)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Repository Structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Backend Setup (Flask + Socket.IO)](#backend-setup-flask--socketio)
7. [Frontend Setup (Vite + React + Tailwind + Framer Motion)](#frontend-setup-vite--react--tailwind--framer-motion)
8. [Running the Full System](#running-the-full-system)
9. [How NeuroCursor Works](#how-neurocursor-works)
10. [UI Tour](#ui-tour)
11. [Configuration & Customization](#configuration--customization)
12. [Troubleshooting](#troubleshooting)
13. [Security, Privacy & Ethics](#security-privacy--ethics)
14. [Hackathon Demo Script (2–3 minutes)](#hackathon-demo-script-23-minutes)

---

## Features

### Real-Time Digital Phenotyping

- Tracks your mouse movement in real time using `pynput`.
- Computes:
  - **Velocity** (px/sec): how fast you’re moving.
  - **Jitter / path variability**: how erratic your path is.
- Uses an **Isolation Forest** (unsupervised ML) to learn your personal baseline and flag deviant patterns as potential micro‑stress.

### Biometric Command Center UI

Built with **React + Tailwind + Framer Motion + Recharts**:

- **Bio‑Rhythm EKG Waveform**
  - EKG‑style live waveform of cursor velocity.
  - Green, smooth waveforms for flow; red segments for tension.
- **Smart Break (Dynamic Pomodoro Ring)**
  - Circular workload gauge that fills faster under higher stress.
  - Estimates **time until next recommended micro‑break** dynamically.
- **Gamified Health Shield**
  - A “Health HP” bar that **regenerates** with calm, efficient movement and **depletes** under erratic, stressed behavior.
- **Zen Breathing Widget (Non‑Blocking)**
  - A **bottom‑right side widget** (never full‑screen) that appears during high strain or when the Smart Break ring fills.
  - Animated circle guides **4s inhale / 6s exhale** cycles.
  - Always out of the way; doesn’t block your work.

### AI Wellbeing Coach

- Voice feedback via **Web Speech API**:
  - Contextual lines for:
    - Entering high stress
    - Recovering from stress
    - Sustained calm focus
- **Strict idle detection**:
  - If no mouse movement for a few seconds, **no voice feedback** is played.
  - Coaching happens only when you’re actually active.

### Session Analytics & Reporting

- Tracks over a session:
  - Total **micro‑stress events**
  - **Time spent in high load**
  - **Average focus score**
  - **Nervous system load index**
- End-of-session **summary modal**:
  - “Digital Wellbeing Score”
  - Short AI‑generated textual insight (profile & recommendation)
  - 1‑click **Copy summary** (for journals, clinician, or hackathon demo).

### Privacy & Digital Trust

- All analysis is **on-device**.
- No screen contents, no keystrokes, no user identity.
- No logs of raw behavioral data are stored by default.

---

## System Architecture

```text
+--------------------------+        Socket.IO        +------------------------------+
|        Frontend          | <--------------------> |           Backend            |
| (Vite + React + Tailwind)|                        |   (Flask + Socket.IO + ML)  |
+--------------------------+                        +------------------------------+
           |                                                       |
           |                                                       |
     Real-time UI:                                       Mouse movement capture:
  - EKG waveform (Recharts)                             - pynput mouse listener
  - Smart Break ring (Framer Motion)                    - velocity & jitter metrics
  - Health Shield HP                                    - IsolationForest (scikit-learn)
  - Zen breathing widget
           |                                                       |
           +--------------------- Real-time metrics ---------------+
```

**Backend responsibilities:**

- Captures mouse events.
- Computes **velocity** and **jitter**.
- Trains an **Isolation Forest** model with your baseline (calibration).
- Emits real-time packets via Socket.IO:
  ```json
  {
    "velocity": 123.45,
    "jitter": 67.89,
    "stress_level": "HIGH" | "LOW",
    "ai_active": true,
    "learning_progress": 37
  }
  ```

**Frontend responsibilities:**

- Connects via Socket.IO to `http://localhost:5000`.
- Renders the biometric dashboard.
- Computes **derived wellbeing metrics** and manages:
  - Smart Break ring
  - Health Shield HP
  - Voice coach state machine
  - Zen breathing widget (side only)
  - Session summary report

---

## Tech Stack

**Backend**

- Python 3.10+  
- Flask 3.x  
- Flask‑SocketIO  
- Flask‑CORS  
- eventlet  
- numpy  
- scikit‑learn (IsolationForest)  
- pynput (for mouse tracking)

**Frontend**

- Vite + React  
- Tailwind CSS  
- Framer Motion  
- Recharts  
- Lucide‑React (icons)  
- Web Speech API (browser TTS)

---

## Repository Structure

Recommended layout:

```text
neurocursor/
├── backend/
│   ├── app.py            # Flask + Socket.IO server
│   ├── tracker.py        # NeuroTracker: mouse capture + velocity + jitter
│   ├── ai_engine.py      # NeuroAI: IsolationForest model
│   └── requirements.txt  # Python deps
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx        # Biometric command center UI (this file)
        └── index.css      # Tailwind + custom animations (orb, breathing, etc.)
```

---

## Prerequisites

### Operating System

- Windows 10/11  
- macOS 12+  
- Linux (X11 session; Wayland may need tweaks for `pynput`)

### Required Software

- **Python**: 3.10+  
  - Check with:
    ```bash
    python --version
    ```
- **Node.js & npm**: Node 18+ recommended  
  - Check with:
    ```bash
    node --version
    npm --version
    ```
- **Git** (for cloning the repo)
- A modern browser (Chrome / Edge / Firefox / Safari) with JS/ES6 support.

### OS Permissions

- On **macOS**: `pynput` may require **Accessibility** or **Input Monitoring** permissions:
  - System Settings → Privacy & Security → Accessibility / Input Monitoring → Allow Terminal / IDE / Python.

---

## Backend Setup (Flask + Socket.IO)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/neurocursor.git
cd neurocursor
```

### 2. Create a virtual environment

From the `backend/` directory:

```bash
cd backend
```

#### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### Windows (PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

You should see `(.venv)` in your terminal prompt.

### 3. Install Python dependencies

Create or confirm `requirements.txt` like:

```txt
Flask==3.0.0
Flask-SocketIO==5.3.6
Flask-Cors==4.0.0
eventlet==0.33.3
numpy==1.26.0
scikit-learn==1.3.0
pynput==1.7.6
```

Then install:

```bash
pip install -r requirements.txt
```

### 4. Backend files overview

- **`tracker.py`** – reads mouse movement, computes:
  - `velocity`: px/sec between move events.
  - `jitter`: path variability / “chaos” of cursor path.
  - Pressing **`s`** toggles a “fake stress mode” for demos.
- **`ai_engine.py`** – `NeuroAI`:
  - Stores recent `[velocity, jitter]` pairs in a buffer.
  - Uses `IsolationForest` to learn your baseline after ~50 valid points.
  - Predicts anomalies as **stress events**.
- **`app.py`** – Flask Socket.IO server:

  - Starts a background loop (`data_stream_background_task`) that:
    - Reads metrics from `NeuroTracker`.
    - Sends `mouse_data` packets over Socket.IO at ~20 Hz.
    - Handles calibration via `start_calibration` event.

  - Minimal structure:
    ```python
    tracker = NeuroTracker()
    ai = NeuroAI()

    @socketio.on('start_calibration')
    def handle_calibration_request():
        ai.reset()
        is_learning_mode = True

    @socketio.on('connect')
    def handle_connect():
        print("✅ Client Connected")
    ```

### 5. Run the backend

From `backend/` with the venv activated:

```bash
python app.py
```

You should see:

- “🚀 Data Stream & AI Engine Started…”
- “✅ Client Connected” when frontend connects.

By default, the backend listens on:

- `http://0.0.0.0:5000` (i.e., `http://localhost:5000` on your own machine)

---

## Frontend Setup (Vite + React + Tailwind + Framer Motion)

### 1. Install frontend dependencies

From the `frontend/` directory:

```bash
cd ../frontend
npm install
```

This installs (from `package.json`):

- React / ReactDOM
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide‑React
- Socket.IO client

### 2. Ensure Tailwind is set up

Your `src/index.css` should already contain:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #020617;
  color: #e5e7eb;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  margin: 0;
}

/* breathing ring, focus orbit, neuro-orb animations */
.breath-ring { ... }
.focus-orbit { ... }
.neuro-orb { ... }
/* etc. */
```

(As per your current `index.css` – no changes needed.)

### 3. Frontend entry files

- `src/main.jsx` (typical Vite entry):

  ```jsx
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import App from './App.jsx';
  import './index.css';

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  ```

- `src/App.jsx` – the full Biometric Command Center UI (you already have the latest version from our last message).

  Key things to note inside:

  - Socket connection:
    ```js
    const socket = io('http://localhost:5000');
    ```
  - Uses:
    - `NeuroLogo` component to render your SVG logo in the header.
    - `NeuroOrb` visual indicator of current tension/focus.
    - `SmartBreakRing`, `HealthShield`, `ZenWidget`, `WellnessCoach`, `SessionSummaryModal`.
  - Uses `framer-motion` for:
    - Layout transitions (`layout` prop).
    - Micro‑interactions on buttons (`whileHover`, `whileTap`).
    - Animated numbers (`AnimatedNumber` with `useSpring`).
    - Non‑blocking Zen breathing widget.

### 4. Run the frontend (Dev Mode)

From `frontend/`:

```bash
npm run dev
```

By default, Vite runs at:

- `http://localhost:5173/`

---

## Running the Full System

1. **Start the backend**:

   ```bash
   cd neurocursor/backend
   source .venv/bin/activate   # or .\.venv\Scripts\Activate.ps1 on Windows
   python app.py
   ```

2. **Start the frontend**:

   ```bash
   cd ../frontend
   npm run dev
   ```

3. Open your browser at:

   ```text
   http://localhost:5173/
   ```

4. Confirm:
   - Top-right shows **“System online”** (green Wi‑Fi icon).
   - Moving the mouse updates:
     - The **Bio‑Rhythm waveform**,
     - Velocity & jitter values,
     - Health Shield & Focus Balance bar.

---

## How NeuroCursor Works

### Backend: Digital Phenotyping Engine

1. **Mouse Capture (`tracker.NeuroTracker`)**
   - Uses `pynput` to listen to mouse move events.
   - Maintains a **moving buffer** of recent points with `(x, y, timestamp)`.
   - Computes:
     - **Velocity**: distance / time between two recent points.
     - **Path length** vs straight‑line distance to get an approximate **tortuosity / jitter**.
   - If you stop moving the mouse:
     - After ~0.15 seconds, velocity & jitter are reset to zero.

2. **AI Model (`ai_engine.NeuroAI`)**
   - Stores recent `(velocity, jitter)` points.
   - On calibration (triggered from frontend):
     - Collects ~50 valid movement samples.
     - Trains an `IsolationForest` model (unsupervised anomaly detector).
   - Prediction:
     - After calibration, predicts each new point as **normal** or **anomaly**.
     - Anomalies are mapped to `stress_level: "HIGH"`.

3. **Data Streaming (`app.py`)**
   - Continuous loop sends packets over Socket.IO:

     ```json
     {
       "velocity": 0.0,
       "jitter": 0.0,
       "stress_level": "LOW",
       "ai_active": true,
       "learning_progress": 37
     }
     ```

   - Exposes events:
     - `mouse_data` – real‑time metrics.
     - `calibration_done` – notifies frontend when AI is ready.
     - `start_calibration` – from frontend to restart baseline learning.

### Frontend: Biometric Command Center

1. **Socket Layer**
   - Connects to `http://localhost:5000`.
   - Updates internal state with each `mouse_data` event.
   - Maintains a `graphData` array for velocity & jitter charts.

2. **Derived Metrics**
   - **Focus score** = `100 - jitter / 3`, clamped to 0–100.
   - **Stress score** = `100 - focusScore`.
   - **Smart Break charge**:
     - Increments faster under higher stress.
     - When it reaches 100%, a Zen breathing suggestion is triggered (side widget).
   - **Health Shield HP**:
     - Damaged by stress, regenerated by calm.
     - Modeled as HP per minute, updated each packet.

3. **AI Voice Coach**
   - Uses Web Speech API for TTS.
   - Carefully throttled:
     - Only speaks if **mouse has moved in the last 3 seconds**.
     - Minimum cooldowns between messages.
   - Different scripts for:
     - Entering high strain.
     - Sustained high strain.
     - Recovering from strain.
     - Sustained calm focus.

4. **Zen Widget (Side Breathing Coach)**
   - Appears at **bottom‑right**.
   - Uses Framer Motion to animate inhale/exhale rhythm.
   - Never blocks the UI; easy to ignore or dismiss.
   - Triggered when:
     - You enter sustained high stress, or
     - Smart Break ring fills, and
     - You are currently active (not idle),
     - And at least 5 minutes since the last Zen suggestion.

---

## UI Tour

### 1. Header

- **Logo**: Your custom NeuroCursor SVG.
- **Title**: “Preventative Digital Health Command Center”.
- **Status line**:
  - Connectivity (green Wi‑Fi when online).
  - Brief description of AI‑driven digital phenotyping.

### 2. Calibration Controls

- **INITIALIZE COACH**:
  - When AI is not calibrated.
  - Starts learning baseline from your normal usage.
- **RECALIBRATE BASELINE**:
  - When AI is already active.
  - Re-collects baseline for changed habits or devices.

### 3. Neuro Orb

- A central floating orb:
  - Expands and reddens with higher strain.
  - Contracts and glows green when calm.
  - Shows percentage **focus stability**.

### 4. Session Snapshot & Privacy Card

- **Session Snapshot**:
  - Micro‑stress events.
  - Time in high load.
  - Average focus.
  - Nervous system load index.
- **Privacy Card**:
  - Guarantees on-device processing.
  - Explicitly states no content / keystroke logging.

### 5. Focus Balance Bar

- Horizontal progress bar:
  - Color-coded (red/green).
  - Labelled with descriptors:
    - Elevated load / Steady focus / Light focus.

### 6. Smart Break Ring

- Circular gauge:
  - Percent charge to next recommended break.
  - Text showing estimated time until next reset (dynamic).
  - Load category: High / Elevated / Light.

### 7. Health Shield

- HP bar:
  - Color-coded from green → amber → red.
  - HP % and strain score.
  - Gamified representation of sustainability of your current work pattern.

### 8. Bio‑Rhythm EKG Waveform

- Velocity plotted over time:
  - EKG‑style.
  - Green for calm, red when in high stress.
  - Visual impression of “neural rhythm” / scanning vs smooth work.

### 9. Jitter Chart

- Path variability (jitter) over time:
  - Red line.
  - Indicates restlessness, overload, or fragmentation.

### 10. Wellness Coach

- Glassmorphic card with:
  - Current tip (high stress vs calm modes).
  - Subtle breathing/“calm zone” visuals.

### 11. Zen Widget

- Bottom‑right **floating breathing coach**:
  - Animated inhale/exhale.
  - Counts down remaining seconds (default 60).
  - Button to skip/close.
  - **Never blocks your content**.

### 12. Session Summary Modal

- Accessible via **“Session report”** button.
- Shows:
  - Duration, Digital Wellbeing Score, profile, recommendations.
  - Copy to clipboard for sharing.
  - “Start new session” resets stats.

---

## Configuration & Customization

### Ports

- Backend: `5000` (in `app.py`)
- Frontend: `5173` (Vite default)

If you change backend port, update:

```js
// App.jsx
const socket = io('http://localhost:5000'); // change port here if needed
```

### Voice Coach

- To fully disable voice, toggle the **Voice coach on/muted** button in the UI.
- For permanent disable, you can:
  - Wrap `speak()` body in a conditional, or
  - Comment out its calls.

### Stress Sensitivity

- Adjust in `ai_engine.py` (IsolationForest `contamination`), or in the frontend, how jitter → focusScore → stressScore is derived.

### Smart Break Dynamics

In `App.jsx`, these lines control how fast the Smart Break fills:

```js
const basePerSecond = 0.012;
const stressBoostPerSecond = (stressScore / 100) * 0.045;
```

Increase/decrease to modify break frequency.

---

## Troubleshooting

### 1. Backend won’t start or `pynput` errors

- On **macOS**:
  - Ensure Terminal/IDE has Accessibility or Input Monitoring permissions.
- On **Linux**:
  - Make sure you’re running in an X11 session (Wayland can be problematic for global input hooks).
- On **Windows**:
  - Run the terminal/IDE with normal privileges; administrator sometimes conflicts with some security tools.

### 2. Frontend says “Signal lost”

- Check backend is running:
  ```bash
  # in backend/
  python app.py
  ```
- Check CORS/Socket.IO path:
  - App uses `io('http://localhost:5000')`.
  - Confirm you’re not using a different port/address.

### 3. Voice still speaking at weird times

We’ve built strict idle detection:

- Voice only triggers when there has been **some movement in the last ~3 seconds**.
- If needed, increase the idle timeout:

```js
const idleNow = now - lastMovementTimeRef.current > 3000; // adjust 3000 → 5000 etc.
```

### 4. UI looks unstyled

- Ensure `index.css` includes Tailwind directives and your custom classes.
- Ensure `main.jsx` imports `./index.css`.
- Ensure Tailwind is correctly configured in `vite.config.js` and `postcss.config.cjs`.

---

## Security, Privacy & Ethics

- **On‑device only**: No data is sent to remote servers.
- **Data minimization**: Only cursor coordinates and timestamps are used; no content.
- **No identifiers**: No account, login, or PII collection.
- **Transparency**: Clear disclaimer that NeuroCursor is not medical, only a wellbeing indicator.

For a hackathon, explicitly state this in your pitch and README to show you’ve thought about **digital trust** and ethics.

---

## Hackathon Demo Script (2–3 minutes)

You can use this as a live walkthrough for judges:

1. **Intro (30–45 sec)**  
   - “This is NeuroCursor – an AI‑powered preventative health tool that uses **digital phenotyping of your mouse** to detect micro‑stress, early burnout, and potential RSI risk in real‑time.”
   - “Everything runs locally, no screen or keystroke data is ever captured — just movement patterns.”

2. **Show Calibration (30 sec)**  
   - Click **INITIALIZE COACH**.
   - Explain baseline learning:
     - “For a few seconds, it learns what ‘normal’ looks like for me — my own cursor rhythm.”
   - When calibration finishes, mention AI is now live.

3. **Biometric Command Center (60 sec)**  
   - Move cursor calmly:
     - Point to **Neuro Orb** (calm, greenish).
     - Show **Focus Balance** near high percentages.
     - EKG waveform fairly smooth.
   - Simulate stress:
     - Rapid, erratic mouse movement.
     - Show:
       - EKG waveform becoming jagged & red spikes.
       - **Health Shield HP** dropping slightly.
       - **Smart Break ring** charging faster.
       - Stress badge flipping to **Tension spike detected**.

4. **Zen Widget & Smart Break (30–40 sec)**  
   - Under sustained stress, point when the **Zen widget** appears bottom-right:
     - “When my nervous system load stays high or the workload ring fills, it offers a **non‑blocking breathing reset** at the side. It never covers my work, but it’s always there when I need it.”

5. **Wellness & Report (30–40 sec)**  
   - Click **Session report**:
     - Show Digital Wellbeing Score.
     - Micro‑stress events and time in high load.
     - Copy summary.
   - Mention:
     - “This is designed for knowledge workers, students, developers — anyone at screen all day — to catch strain patterns **before** they become burnout or RSI.”

6. **Close (10–15 sec)**  
   - “NeuroCursor brings **AI + digital trust + preventative health** together in a way that’s visually intuitive, privacy‑preserving, and easy to adopt in daily workflows.”

---
