
import os
import glob
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

# Dataset location
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_FOLDER = os.path.join(_BASE_DIR, "HandiVoiceDataSet")
if not os.path.isdir(DATASET_FOLDER):
    DATASET_FOLDER = r"C:\handivoice-web-dashboard-main\HandiVoiceDataSet"

# Output model
OUTPUT_MODEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "HandiVoice_RandomForest.joblib")

# Sensor columns
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

print("=" * 55)
print("       HANDIVOICE - MODEL TRAINING")
print("=" * 55)

files = glob.glob(os.path.join(DATASET_FOLDER, "*.csv"))

if not files:
    raise SystemExit("ERROR: No CSV files found!")

all_data = []

for file_path in files:
    try:
        df = pd.read_csv(file_path, encoding="utf-8-sig")

        if "label" not in df.columns:
            print("Skipped (no label column):", os.path.basename(file_path))
            continue

        # Use the label stored inside the CSV
        labels = df["label"].fillna("").astype(str).str.strip()

        # If the label column is empty, use the filename
        filename_label = os.path.basename(file_path)
        filename_label = filename_label.replace("HandiVoice_", "")
        filename_label = filename_label[:-4].strip("_")

        labels = labels.replace("", filename_label)

        available = [c for c in FEATURES if c in df.columns]

        if not available:
            print("Skipped (no sensor columns):", filename_label)
            continue

        sensor_data = df[available].copy()

        for col in available:
            sensor_data[col] = pd.to_numeric(
                sensor_data[col], errors="coerce"
            )

        sensor_data["label"] = labels

        sensor_data = sensor_data.dropna(
            subset=["label"]
        )

        sensor_data = sensor_data[
            sensor_data["label"] != ""
        ]

        all_data.append(sensor_data)

        print(
            f"Loaded: {filename_label} "
            f"({len(sensor_data)} samples)"
        )

    except Exception as error:
        print("ERROR:", os.path.basename(file_path), error)

if not all_data:
    raise SystemExit("ERROR: No usable dataset was loaded!")

data = pd.concat(all_data, ignore_index=True)

# Keep only sensor columns that contain at least one numeric value
feature_columns = [
    c for c in FEATURES
    if c in data.columns and data[c].notna().any()
]

if not feature_columns:
    raise SystemExit("ERROR: No usable numeric sensor values!")

X = data[feature_columns]
y = data["label"].astype(str)

# Remove rows that have no sensor readings at all
valid_rows = X.notna().any(axis=1)
X = X.loc[valid_rows]
y = y.loc[valid_rows]

classes = sorted(y.unique())

if len(classes) < 2:
    raise SystemExit("ERROR: At least two gesture classes are required!")

print("\n" + "=" * 55)
print("DATASET SUMMARY")
print("=" * 55)
print("Total samples:", len(X))
print("Number of classes:", len(classes))
print("Sensor features:", len(feature_columns))

print("\nSamples per gesture:")
print(y.value_counts().sort_index().to_string())

# Build the first prototype model
model = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("classifier", RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    ))
])

print("\nTraining model...")
model.fit(X, y)

# Save model and required feature information
bundle = {
    "model": model,
    "feature_columns": feature_columns,
    "classes": classes
}

joblib.dump(bundle, OUTPUT_MODEL)

print("\n" + "=" * 55)
print("TRAINING COMPLETED")
print("=" * 55)
print("Model saved to:", os.path.abspath(OUTPUT_MODEL))
print("Recognized gesture classes:", len(classes))
print("\nThis is a first prototype.")
print("Its training data score is NOT a real-world accuracy test.")
print("Test it later using new independent recordings.")
print("=" * 55)
