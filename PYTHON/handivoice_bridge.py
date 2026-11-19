"""
HandiVoice PRO - AI Hardware Bridge & Real-Time Telemetry Server
================================================================
Bridges ESP32 Smart Glove via Serial (115200 baud) to the Web Dashboard.
Runs Random Forest classification in Python, applies temporal consensus,
and broadcasts live telemetry + predictions over WebSocket (ws://localhost:8765/ws).
Provides REST endpoints on http://localhost:8765/api/
"""

import os
import sys
import json
import time
import glob
import asyncio
import threading
from collections import Counter, deque

import joblib
import pandas as pd
import numpy as np

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    serial = None

from starlette.applications import Starlette
from starlette.responses import JSONResponse, Response
from starlette.routing import Route, WebSocketRoute
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocket, WebSocketDisconnect
import uvicorn

# Configuration
HOST = "0.0.0.0"
PORT = 8765
DEFAULT_BAUD = 115200

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DATASET_DIR = os.path.join(PROJECT_DIR, "HandiVoiceDataSet")
MODEL_PATH = os.path.join(BASE_DIR, "HandiVoice_RandomForest.joblib")

FEATURES = [
    "thumb_raw", "index_raw", "middle_raw", "ring_raw", "pinky_raw",
    "thumb_bend_pct", "index_bend_pct", "middle_bend_pct", "ring_bend_pct", "pinky_bend_pct",
    "ax", "ay", "az",
    "gx", "gy", "gz"
]

# Bridge State
state = {
    "status": "DISCONNECTED",  # DISCONNECTED, CONNECTING, CONNECTED, AI READY, RECOGNIZING, SIMULATING, ERROR
    "serial_port": None,
    "baud_rate": DEFAULT_BAUD,
    "model_loaded": False,
    "model_classes": [],
    "last_prediction": None,
    "stable_prediction": None,
    "confidence": 0.0,
    "packet_count": 0,
    "hz": 0.0,
    "error_message": None,
    "simulation_active": False
}

# Global Model Reference
model = None
feature_columns = FEATURES
history_buffer = deque(maxlen=7)
connected_clients = set()
serial_thread = None
serial_stop_flag = threading.Event()
sim_thread = None
sim_stop_flag = threading.Event()

# -------------------------------------------------------------
# Model Loader
# -------------------------------------------------------------
def load_model():
    global model, feature_columns, state
    if not os.path.exists(MODEL_PATH):
        print(f"[!] Model file not found at: {MODEL_PATH}")
        state["model_loaded"] = False
        return False

    try:
        loaded = joblib.load(MODEL_PATH)
        if isinstance(loaded, dict):
            model = (
                loaded.get("model")
                or loaded.get("pipeline")
                or loaded.get("classifier")
            )
            feature_columns = loaded.get("feature_columns", FEATURES)
            classes = loaded.get("classes", [])
            if hasattr(classes, "tolist"):
                classes = classes.tolist()
            state["model_classes"] = list(classes)
        else:
            model = loaded
            feature_columns = FEATURES
            if hasattr(model, "classes_"):
                state["model_classes"] = list(model.classes_)

        state["model_loaded"] = True
        print(f"[+] Loaded Random Forest model successfully! Classes: {len(state['model_classes'])}")
        return True
    except Exception as e:
        print(f"[!] Error loading model: {e}")
        state["model_loaded"] = False
        state["error_message"] = str(e)
        return False

# -------------------------------------------------------------
# Packet Parsing & Feature Extraction
# -------------------------------------------------------------
def parse_packet_line(line_str):
    line = line_str.strip()
    if not line:
        return None

    # Check for JSON packet
    if line.startswith("{") and line.endswith("}"):
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            pass

    # Fallback: Check for CSV packet (11 or 16 numbers)
    # Formats: flex[5], imu[6] = 11 values OR flex[5], bend[5], imu[6] = 16 values
    parts = [p.strip() for p in line.split(",") if p.strip()]
    if len(parts) >= 11:
        try:
            nums = [float(p) for p in parts]
            if len(nums) == 11:
                # flex_raw[5], ax, ay, az, gx, gy, gz
                flex = [int(v) for v in nums[0:5]]
                # Estimate bend pct if not provided (0-100 range normalized from 1200-2400)
                bend = [min(100, max(0, int((val - 1200) / 12))) for val in flex]
                imu = {
                    "ax": nums[5], "ay": nums[6], "az": nums[7],
                    "gx": nums[8], "gy": nums[9], "gz": nums[10]
                }
                return {
                    "type": "sample",
                    "time_ms": int(time.time() * 1000),
                    "flex_raw": flex,
                    "bend_pct": bend,
                    "imu": imu
                }
            elif len(nums) >= 16:
                return {
                    "type": "sample",
                    "time_ms": int(time.time() * 1000),
                    "flex_raw": [int(v) for v in nums[0:5]],
                    "bend_pct": [int(v) for v in nums[5:10]],
                    "imu": {
                        "ax": nums[10], "ay": nums[11], "az": nums[12],
                        "gx": nums[13], "gy": nums[14], "gz": nums[15]
                    }
                }
        except (ValueError, IndexError):
            pass

    return None

def extract_features(packet):
    flex = packet.get("flex_raw", [])
    bend = packet.get("bend_pct", [])
    imu = packet.get("imu", {})

    if len(flex) != 5:
        return None
    if len(bend) != 5:
        bend = [min(100, max(0, int((val - 1200) / 12))) for val in flex]

    values = {
        "thumb_raw": flex[0],
        "index_raw": flex[1],
        "middle_raw": flex[2],
        "ring_raw": flex[3],
        "pinky_raw": flex[4],

        "thumb_bend_pct": bend[0],
        "index_bend_pct": bend[1],
        "middle_bend_pct": bend[2],
        "ring_bend_pct": bend[3],
        "pinky_bend_pct": bend[4],

        "ax": float(imu.get("ax", 0.0)),
        "ay": float(imu.get("ay", 0.0)),
        "az": float(imu.get("az", 0.0)),
        "gx": float(imu.get("gx", 0.0)),
        "gy": float(imu.get("gy", 0.0)),
        "gz": float(imu.get("gz", 0.0))
    }

    return pd.DataFrame(
        [[values.get(col, 0) for col in feature_columns]],
        columns=feature_columns
    )

# -------------------------------------------------------------
# WebSocket Broadcaster
# -------------------------------------------------------------
main_event_loop = None

def broadcast_sync(message_dict):
    global main_event_loop, connected_clients
    if not connected_clients or main_event_loop is None:
        return

    text_data = json.dumps(message_dict, ensure_ascii=False)
    for ws in list(connected_clients):
        try:
            asyncio.run_coroutine_threadsafe(ws.send_text(text_data), main_event_loop)
        except Exception:
            pass

# -------------------------------------------------------------
# Serial Reader Thread
# -------------------------------------------------------------
def run_serial_reader(port_name, baud_rate):
    global state, model, history_buffer, serial_stop_flag
    state["status"] = "CONNECTING"
    state["serial_port"] = port_name
    state["baud_rate"] = baud_rate
    broadcast_sync({"type": "state_change", "state": state["status"]})

    try:
        with serial.Serial(port_name, baud_rate, timeout=1.0) as ser:
            state["status"] = "CONNECTED" if not state["model_loaded"] else "AI READY"
            broadcast_sync({"type": "state_change", "state": state["status"], "port": port_name})
            print(f"[+] Serial connected on {port_name} @ {baud_rate}")

            packet_counter = 0
            hz_start = time.time()

            while not serial_stop_flag.is_set():
                try:
                    raw_line = ser.readline().decode("utf-8", errors="ignore")
                    if not raw_line:
                        continue

                    packet = parse_packet_line(raw_line)
                    if packet is None:
                        continue

                    packet_counter += 1
                    state["packet_count"] = packet_counter
                    now = time.time()
                    elapsed = now - hz_start
                    if elapsed >= 1.0:
                        state["hz"] = round(packet_counter / elapsed, 1)
                        packet_counter = 0
                        hz_start = now

                    # Run inference
                    recognized = None
                    stable_val = None
                    confidence = 0.0
                    top_candidates = []

                    if state["model_loaded"] and model is not None:
                        df_features = extract_features(packet)
                        if df_features is not None:
                            pred = model.predict(df_features)[0]
                            recognized = str(pred)
                            history_buffer.append(recognized)

                            # Stable prediction (majority voting in window of 7)
                            counts = Counter(history_buffer).most_common(2)
                            if counts and (counts[0][1] / len(history_buffer)) >= 0.5:
                                stable_val = counts[0][0]
                            else:
                                stable_val = recognized

                            if hasattr(model, "predict_proba"):
                                try:
                                    probs = model.predict_proba(df_features)[0]
                                    confidence = float(np.max(probs) * 100)
                                    # Top 3
                                    classes = state["model_classes"] or getattr(model, "classes_", [])
                                    top_idx = np.argsort(probs)[::-1][:3]
                                    for idx in top_idx:
                                        if idx < len(classes):
                                            top_candidates.append({
                                                "label": str(classes[idx]),
                                                "score": round(float(probs[idx] * 100), 1)
                                            })
                                except Exception:
                                    pass

                            state["status"] = "RECOGNIZING"
                            state["last_prediction"] = recognized
                            state["stable_prediction"] = stable_val
                            state["confidence"] = round(confidence, 1)

                    # Broadcast telemetry packet
                    payload = {
                        "type": "telemetry",
                        "time_ms": packet.get("time_ms", int(time.time() * 1000)),
                        "flex_raw": packet.get("flex_raw", [0, 0, 0, 0, 0]),
                        "bend_pct": packet.get("bend_pct", [0, 0, 0, 0, 0]),
                        "imu": packet.get("imu", {}),
                        "hz": state["hz"],
                        "recognized": recognized,
                        "stable": stable_val,
                        "confidence": state["confidence"],
                        "top_candidates": top_candidates,
                        "status": state["status"]
                    }
                    broadcast_sync(payload)

                except (UnicodeDecodeError, serial.SerialException) as se:
                    print(f"[!] Serial read error: {se}")
                    break

    except Exception as e:
        print(f"[!] Failed to open serial port {port_name}: {e}")
        state["status"] = "ERROR"
        state["error_message"] = str(e)
        broadcast_sync({"type": "state_change", "state": "ERROR", "error": str(e)})
        return

    state["status"] = "DISCONNECTED"
    state["serial_port"] = None
    broadcast_sync({"type": "state_change", "state": "DISCONNECTED"})
    print(f"[-] Serial disconnected from {port_name}")

# -------------------------------------------------------------
# Simulation Generator Thread (For Testing without Physical Glove)
# -------------------------------------------------------------
def run_simulation():
    global state, sim_stop_flag, model
    state["status"] = "SIMULATING"
    state["simulation_active"] = True
    broadcast_sync({"type": "state_change", "state": "SIMULATING"})
    print("[+] Simulation Mode Activated - Streaming authentic signs...")

    # Load authentic sample gestures from dataset
    samples = []
    if os.path.exists(DATASET_DIR):
        csv_files = glob.glob(os.path.join(DATASET_DIR, "HandiVoice_*.csv"))
        for csv_file in csv_files[:15]:
            try:
                df = pd.read_csv(csv_file)
                if not df.empty:
                    samples.append((os.path.basename(csv_file), df))
            except Exception:
                pass

    idx_sign = 0
    while not sim_stop_flag.is_set():
        try:
            if samples:
                filename, df_sign = samples[idx_sign % len(samples)]
                row_idx = int(time.time() * 5) % len(df_sign)
                row = df_sign.iloc[row_idx]

                flex = [int(row["thumb_raw"]), int(row["index_raw"]), int(row["middle_raw"]), int(row["ring_raw"]), int(row["pinky_raw"])]
                bend = [int(row["thumb_bend_pct"]), int(row["index_bend_pct"]), int(row["middle_bend_pct"]), int(row["ring_bend_pct"]), int(row["pinky_bend_pct"])]
                imu = {
                    "ax": float(row["ax"]), "ay": float(row["ay"]), "az": float(row["az"]),
                    "gx": float(row["gx"]), "gy": float(row["gy"]), "gz": float(row["gz"])
                }
                label_target = str(row.get("label", ""))
            else:
                # Default synthetic motion
                t = time.time()
                flex = [int(1500 + 400 * np.sin(t * 2 + i)) for i in range(5)]
                bend = [int(50 + 40 * np.sin(t * 2 + i)) for i in range(5)]
                imu = {"ax": float(np.sin(t)), "ay": float(np.cos(t)), "az": 9.8, "gx": 0.0, "gy": 0.0, "gz": 0.0}
                label_target = "أ"

            packet = {
                "type": "sample",
                "time_ms": int(time.time() * 1000),
                "flex_raw": flex,
                "bend_pct": bend,
                "imu": imu
            }

            # Inference
            recognized = label_target
            confidence = 94.5
            top_candidates = [{"label": label_target, "score": 94.5}]

            if state["model_loaded"] and model is not None:
                df_feat = extract_features(packet)
                if df_feat is not None:
                    pred = model.predict(df_feat)[0]
                    recognized = str(pred)
                    if hasattr(model, "predict_proba"):
                        probs = model.predict_proba(df_feat)[0]
                        confidence = round(float(np.max(probs) * 100), 1)

            payload = {
                "type": "telemetry",
                "time_ms": packet["time_ms"],
                "flex_raw": flex,
                "bend_pct": bend,
                "imu": imu,
                "hz": 20.0,
                "recognized": recognized,
                "stable": recognized,
                "confidence": confidence,
                "top_candidates": top_candidates,
                "status": "SIMULATING"
            }
            broadcast_sync(payload)

            if int(time.time()) % 4 == 0 and (row_idx == 0):
                idx_sign += 1

            time.sleep(0.08)  # ~12.5 Hz update rate

        except Exception as e:
            print(f"[!] Sim loop error: {e}")
            time.sleep(0.5)

    state["status"] = "DISCONNECTED"
    state["simulation_active"] = False
    broadcast_sync({"type": "state_change", "state": "DISCONNECTED"})
    print("[-] Simulation Mode Stopped")

# -------------------------------------------------------------
# REST API Handlers
# -------------------------------------------------------------
async def handle_status(request):
    return JSONResponse(state)

async def handle_ports(request):
    ports_list = []
    if serial is not None:
        try:
            for p in serial.tools.list_ports.comports():
                ports_list.append({
                    "port": p.device,
                    "description": p.description,
                    "manufacturer": getattr(p, "manufacturer", "Unknown")
                })
        except Exception as e:
            print(f"[!] Error listing ports: {e}")

    return JSONResponse({
        "ports": ports_list,
        "count": len(ports_list)
    })

async def handle_connect(request):
    global serial_thread, serial_stop_flag
    try:
        body = await request.json()
        port_name = body.get("port")
        baud = int(body.get("baud", DEFAULT_BAUD))

        if not port_name:
            return JSONResponse({"success": False, "error": "Missing 'port' field."}, status_code=400)

        # Stop simulation if active
        stop_simulation()

        # Stop existing serial if running
        serial_stop_flag.set()
        if serial_thread and serial_thread.is_alive():
            serial_thread.join(timeout=1.0)

        serial_stop_flag.clear()
        serial_thread = threading.Thread(target=run_serial_reader, args=(port_name, baud), daemon=True)
        serial_thread.start()

        return JSONResponse({"success": True, "message": f"Connecting to {port_name} at {baud} baud..."})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

async def handle_disconnect(request):
    global serial_stop_flag, serial_thread
    serial_stop_flag.set()
    stop_simulation()
    state["status"] = "DISCONNECTED"
    state["serial_port"] = None
    broadcast_sync({"type": "state_change", "state": "DISCONNECTED"})
    return JSONResponse({"success": True, "message": "Disconnected cleanly."})

def stop_simulation():
    global sim_stop_flag, sim_thread
    sim_stop_flag.set()
    if sim_thread and sim_thread.is_alive():
        sim_thread.join(timeout=0.5)

async def handle_simulate(request):
    global sim_thread, sim_stop_flag
    try:
        body = await request.json() if request.method == "POST" else {}
        action = body.get("action", "toggle")

        if action == "start" or (action == "toggle" and not state["simulation_active"]):
            # Stop serial
            serial_stop_flag.set()
            sim_stop_flag.clear()
            sim_thread = threading.Thread(target=run_simulation, daemon=True)
            sim_thread.start()
            return JSONResponse({"success": True, "simulation": True, "message": "Simulation started."})
        else:
            stop_simulation()
            return JSONResponse({"success": True, "simulation": False, "message": "Simulation stopped."})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

async def handle_dataset_info(request):
    classes = []
    total_samples = 0
    if os.path.exists(DATASET_DIR):
        csv_files = glob.glob(os.path.join(DATASET_DIR, "HandiVoice_*.csv"))
        for path in csv_files:
            fname = os.path.basename(path)
            # HandiVoice_<sign>_*.csv
            sign_part = fname.replace("HandiVoice_", "").split(".")[0].strip("_")
            try:
                with open(path, "r", encoding="utf-8") as f:
                    lines = sum(1 for _ in f) - 1
                classes.append({"sign": sign_part, "file": fname, "samples": max(0, lines)})
                total_samples += max(0, lines)
            except Exception:
                pass

    return JSONResponse({
        "classes_count": len(classes),
        "total_samples": total_samples,
        "classes": sorted(classes, key=lambda x: x["sign"]),
        "model_loaded": state["model_loaded"],
        "model_features": feature_columns
    })

async def handle_retrain(request):
    # Triggers model retraining using TRAIN_MODEL.py logic
    train_script = os.path.join(BASE_DIR, "TRAIN_MODEL.py")
    if not os.path.exists(train_script):
        return JSONResponse({"success": False, "error": "TRAIN_MODEL.py not found."}, status_code=404)

    def do_retrain():
        try:
            print("[*] Starting retraining...")
            os.system(f'"{sys.executable}" "{train_script}"')
            load_model()
            broadcast_sync({"type": "model_reloaded", "classes": state["model_classes"]})
            print("[+] Retraining complete and model reloaded!")
        except Exception as err:
            print(f"[!] Retrain error: {err}")

    threading.Thread(target=do_retrain, daemon=True).start()
    return JSONResponse({"success": True, "message": "Retraining initiated in background."})

async def handle_index(request):
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>HandiVoice PRO - AI Bridge</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; padding: 2rem; }}
            .card {{ background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; max-width: 600px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }}
            h1 {{ color: #38bdf8; margin-top: 0; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; background: #0284c7; color: white; }}
            ul {{ line-height: 1.8; }}
            code {{ background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #a5f3fc; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>HandiVoice PRO &bull; AI Bridge</h1>
            <p>Status: <span class="badge">{state["status"]}</span></p>
            <p>Model Loaded: <strong>{"YES (" + str(len(state["model_classes"])) + " classes)" if state["model_loaded"] else "NO"}</strong></p>
            <p>Active Port: <code>{state["serial_port"] or "None"}</code> @ {state["baud_rate"]} baud</p>
            <h3>Endpoints:</h3>
            <ul>
                <li><code>GET /api/status</code> &mdash; Bridge and model status</li>
                <li><code>GET /api/ports</code> &mdash; Scan active serial COM ports</li>
                <li><code>POST /api/connect</code> &mdash; Connect to ESP32 Smart Glove</li>
                <li><code>POST /api/disconnect</code> &mdash; Disconnect cleanly</li>
                <li><code>POST /api/simulate</code> &mdash; Toggle synthetic/dataset stream</li>
                <li><code>GET /api/dataset_info</code> &mdash; 31 authentic signs sample counts</li>
                <li><code>WebSocket /ws</code> &mdash; Live telemetry and predictions stream</li>
            </ul>
        </div>
    </body>
    </html>
    """
    return Response(content=html, media_type="text/html")

# -------------------------------------------------------------
# WebSocket Endpoint
# -------------------------------------------------------------
async def websocket_endpoint(websocket: WebSocket):
    global connected_clients
    await websocket.accept()
    connected_clients.add(websocket)
    print(f"[+] WebSocket client connected. Total clients: {len(connected_clients)}")

    # Send initial snapshot
    await websocket.send_text(json.dumps({
        "type": "welcome",
        "state": state,
        "classes": state["model_classes"]
    }, ensure_ascii=False))

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                cmd = msg.get("action")
                if cmd == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "time": time.time()}))
                elif cmd == "simulate":
                    if not state["simulation_active"]:
                        sim_stop_flag.clear()
                        sim_t = threading.Thread(target=run_simulation, daemon=True)
                        sim_t.start()
                    else:
                        stop_simulation()
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[!] WebSocket exception: {e}")
    finally:
        connected_clients.discard(websocket)
        print(f"[-] WebSocket client disconnected. Remaining: {len(connected_clients)}")

# -------------------------------------------------------------
# Application Setup & Startup
# -------------------------------------------------------------
routes = [
    Route("/", handle_index),
    Route("/api/status", handle_status, methods=["GET"]),
    Route("/api/ports", handle_ports, methods=["GET"]),
    Route("/api/connect", handle_connect, methods=["POST"]),
    Route("/api/disconnect", handle_disconnect, methods=["POST"]),
    Route("/api/simulate", handle_simulate, methods=["POST", "GET"]),
    Route("/api/dataset_info", handle_dataset_info, methods=["GET"]),
    Route("/api/retrain", handle_retrain, methods=["POST"]),
    WebSocketRoute("/ws", websocket_endpoint)
]

middleware = [
    Middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
]

app = Starlette(routes=routes, middleware=middleware)

def main():
    global main_event_loop
    print("=" * 60)
    print("      HANDIVOICE PRO - LOCAL AI & HARDWARE BRIDGE")
    print("=" * 60)
    print(f"Server URL:     http://localhost:{PORT}")
    print(f"WebSocket URL:  ws://localhost:{PORT}/ws")
    print(f"Model Path:     {MODEL_PATH}")
    print(f"Dataset Path:   {DATASET_DIR}")
    print("-" * 60)

    # Initial model load
    load_model()

    # Capture loop reference
    main_event_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(main_event_loop)

    config = uvicorn.Config(app=app, host=HOST, port=PORT, loop="asyncio", log_level="info")
    server = uvicorn.Server(config)
    main_event_loop.run_until_complete(server.serve())

if __name__ == "__main__":
    main()
