
import os
import json
import serial
import joblib
import pandas as pd
from collections import Counter, deque

# ==================================
# HANDIVOICE LIVE MODEL TEST
# ==================================

PORT = "COM7"
BAUD_RATE = 115200

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "HandiVoice_RandomForest.joblib")
if not os.path.isfile(MODEL_PATH):
    MODEL_PATH = "HandiVoice_RandomForest.joblib"

FEATURES = [
    "thumb_raw",
    "index_raw",
    "middle_raw",
    "ring_raw",
    "pinky_raw",

    "thumb_bend_pct",
    "index_bend_pct",
    "middle_bend_pct",
    "ring_bend_pct",
    "pinky_bend_pct",

    "ax", "ay", "az",
    "gx", "gy", "gz"
]

# Load trained model
loaded = joblib.load(MODEL_PATH)

# Support either a saved pipeline or a model bundle
if isinstance(loaded, dict):
    model = (
        loaded.get("model")
        or loaded.get("pipeline")
        or loaded.get("classifier")
    )
    if model is None:
        raise ValueError("Model not found inside saved file.")

    feature_columns = loaded.get("feature_columns", FEATURES)
else:
    model = loaded
    feature_columns = FEATURES

history = deque(maxlen=7)

print("=" * 45)
print("       HANDIVOICE LIVE TEST")
print("=" * 45)
print("Port:", PORT)
print("Baud:", BAUD_RATE)
print("Loading model: OK")
print("Waiting for ESP32 data...")
print("Press CTRL+C to stop.")
print("=" * 45)

def extract_features(packet):
    flex = packet.get("flex_raw", [])
    bend = packet.get("bend_pct", [])
    imu = packet.get("imu", {})

    if len(flex) != 5 or len(bend) != 5:
        return None

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

        "ax": imu.get("ax", 0),
        "ay": imu.get("ay", 0),
        "az": imu.get("az", 0),
        "gx": imu.get("gx", 0),
        "gy": imu.get("gy", 0),
        "gz": imu.get("gz", 0)
    }

    return pd.DataFrame(
        [[values.get(col, 0) for col in feature_columns]],
        columns=feature_columns
    )

try:
    with serial.Serial(PORT, BAUD_RATE, timeout=1) as esp:
        print("ESP32 connected successfully!")

        while True:
            line = esp.readline().decode(
                "utf-8", errors="ignore"
            ).strip()

            if not line.startswith("{"):
                continue

            try:
                packet = json.loads(line)

                if packet.get("type") != "sample":
                    continue

                data = extract_features(packet)

                if data is None:
                    continue

                prediction = model.predict(data)[0]
                history.append(str(prediction))

                final_prediction = Counter(history).most_common(1)[0][0]

                confidence_text = ""

                if hasattr(model, "predict_proba"):
                    probabilities = model.predict_proba(data)[0]
                    confidence = max(probabilities) * 100
                    confidence_text = f" | Model score: {confidence:.1f}%"

                print(
                    f"\rRecognized: {final_prediction} "
                    f"| Stable: {final_prediction}"
                    f"{confidence_text}       ",
                    end="",
                    flush=True
                )

            except (json.JSONDecodeError, ValueError, KeyError, TypeError):
                continue

except KeyboardInterrupt:
    print("\n\nTest stopped.")

except serial.SerialException as error:
    print("\nSerial connection error:", error)

except Exception as error:
    print("\nError:", error)
