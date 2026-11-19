
import csv
import glob
import os

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
folder = os.path.join(_BASE_DIR, "HandiVoiceDataSet")
if not os.path.isdir(folder):
    folder = r"C:\handivoice-web-dashboard-main\HandiVoiceDataSet"

print("HANDIVOICE DATASET CHECK")
print("=" * 50)

for path in sorted(glob.glob(os.path.join(folder, "*.csv"))):
    try:
        with open(path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f)
            header = next(reader, [])
            rows = sum(1 for row in reader)

        print(f"\nFile: {os.path.basename(path)}")
        print(f"Samples: {rows}")
        print(f"Columns: {header}")

    except Exception as e:
        print(f"\nERROR: {os.path.basename(path)}")
        print(e)

print("\n" + "=" * 50)
print("Dataset inspection finished.")
