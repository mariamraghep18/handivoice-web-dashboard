import csv
import json
import queue
import threading
import time
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

try:
    import serial
    from serial.tools import list_ports
except ImportError:
    serial = None
    list_ports = None


BAUD_RATE = 115200
FLEX_NAMES = ["thumb", "index", "middle", "ring", "pinky"]
IMU_NAMES = ["ax", "ay", "az", "gx", "gy", "gz"]

CSV_FIELDS = [
    "label", "hand", "time_ms", "computer_time",
    "thumb_raw", "index_raw", "middle_raw", "ring_raw", "pinky_raw",
    "thumb_bend_pct", "index_bend_pct", "middle_bend_pct",
    "ring_bend_pct", "pinky_bend_pct",
    "ax", "ay", "az", "gx", "gy", "gz",
    "calibrated"
]


class HandiVoiceRecorder:
    def __init__(self, root):
        self.root = root
        self.root.title("HandiVoice - Gesture Dataset Recorder")
        self.root.geometry("760x570")
        self.root.minsize(680, 500)

        self.serial_port = None
        self.reader_thread = None
        self.reader_running = False
        self.messages = queue.Queue()

        self.recording = False
        self.stopping = False
        self.current_label = ""
        self.samples = []
        self.sample_count = 0
        self.last_status = "Not connected"

        self.port_var = tk.StringVar()
        self.label_var = tk.StringVar()
        self.status_var = tk.StringVar(value="Not connected")
        self.count_var = tk.StringVar(value="Saved samples in this recording: 0")
        self.last_data_var = tk.StringVar(value="Waiting for sensor data")

        self.build_ui()
        self.refresh_ports()
        self.root.after(100, self.process_messages)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def build_ui(self):
        main = ttk.Frame(self.root, padding=16)
        main.pack(fill="both", expand=True)

        ttk.Label(
            main, text="HandiVoice Gesture Recorder",
            font=("Segoe UI", 18, "bold")
        ).pack(anchor="w")

        ttk.Label(
            main,
            text="Record your glove gestures and save labeled sensor samples to CSV.",
            font=("Segoe UI", 10)
        ).pack(anchor="w", pady=(2, 14))

        connection = ttk.LabelFrame(main, text="1. USB Connection", padding=12)
        connection.pack(fill="x", pady=(0, 12))

        ttk.Label(connection, text="COM Port:").grid(row=0, column=0, sticky="w")
        self.port_combo = ttk.Combobox(
            connection, textvariable=self.port_var, state="readonly", width=24
        )
        self.port_combo.grid(row=0, column=1, padx=8, sticky="w")

        ttk.Button(
            connection, text="Refresh", command=self.refresh_ports
        ).grid(row=0, column=2, padx=4)

        self.connect_button = ttk.Button(
            connection, text="Connect", command=self.connect_serial
        )
        self.connect_button.grid(row=0, column=3, padx=4)

        self.disconnect_button = ttk.Button(
            connection, text="Disconnect", command=self.disconnect_serial,
            state="disabled"
        )
        self.disconnect_button.grid(row=0, column=4, padx=4)

        ttk.Label(
            connection,
            text=f"Baud rate: {BAUD_RATE} | Close Arduino Serial Monitor before connecting.",
            foreground="#555"
        ).grid(row=1, column=0, columnspan=5, sticky="w", pady=(8, 0))

        recording_box = ttk.LabelFrame(main, text="2. Gesture Recording", padding=12)
        recording_box.pack(fill="x", pady=(0, 12))

        ttk.Label(recording_box, text="Gesture label (Arabic letter or symbol):").grid(
            row=0, column=0, sticky="w"
        )
        self.label_entry = ttk.Entry(
            recording_box, textvariable=self.label_var, width=24, justify="right"
        )
        self.label_entry.grid(row=0, column=1, padx=8, sticky="w")

        buttons = ttk.Frame(recording_box)
        buttons.grid(row=1, column=0, columnspan=2, sticky="w", pady=(14, 4))

        self.start_button = ttk.Button(
            buttons, text="Start Recording", command=self.start_recording,
            state="disabled"
        )
        self.start_button.pack(side="left", padx=(0, 8))

        self.stop_button = ttk.Button(
            buttons, text="Stop & Save", command=self.stop_recording,
            state="disabled"
        )
        self.stop_button.pack(side="left")

        ttk.Label(
            recording_box,
            text="Workflow: choose a label → Start Recording → make the gesture → Stop & Save.",
            foreground="#555"
        ).grid(row=2, column=0, columnspan=2, sticky="w", pady=(10, 0))

        status_box = ttk.LabelFrame(main, text="3. Live Status", padding=12)
        status_box.pack(fill="both", expand=True, pady=(0, 12))

        ttk.Label(status_box, text="Connection / recording status:").pack(anchor="w")
        ttk.Label(
            status_box, textvariable=self.status_var,
            font=("Segoe UI", 11, "bold")
        ).pack(anchor="w", pady=(2, 10))

        ttk.Label(status_box, textvariable=self.count_var).pack(anchor="w")
        ttk.Label(
            status_box, textvariable=self.last_data_var,
            wraplength=680, foreground="#444"
        ).pack(anchor="w", pady=(10, 0))

        footer = ttk.Frame(main)
        footer.pack(fill="x")
        ttk.Label(
            footer,
            text="Data saved: CSV | Flex sensors: 5/5 (Thumb included) | IMU: accelerometer + gyroscope",
            foreground="#555"
        ).pack(anchor="w")

    def refresh_ports(self):
        if list_ports is None:
            messagebox.showerror(
                "Missing library",
                "pyserial is not installed.\n\nOpen Command Prompt and run:\npy -m pip install pyserial"
            )
            return
        ports = [p.device for p in list_ports.comports()]
        self.port_combo["values"] = ports
        if ports and self.port_var.get() not in ports:
            self.port_var.set(ports[0])
        elif not ports:
            self.port_var.set("")

    def connect_serial(self):
        if serial is None:
            messagebox.showerror(
                "Missing library",
                "Install pyserial using:\npy -m pip install pyserial"
            )
            return

        port = self.port_var.get().strip()
        if not port:
            messagebox.showwarning("Select COM port", "Choose the ESP32 COM port first.")
            return

        try:
            self.serial_port = serial.Serial(
                port=port,
                baudrate=BAUD_RATE,
                timeout=0.2,
                write_timeout=1
            )
            # Opening the USB serial port may reset the ESP32.
            time.sleep(2)
            self.serial_port.reset_input_buffer()

            self.reader_running = True
            self.reader_thread = threading.Thread(
                target=self.serial_reader, daemon=True
            )
            self.reader_thread.start()

            self.status_var.set(f"Connected to {port} at {BAUD_RATE} baud")
            self.connect_button.config(state="disabled")
            self.disconnect_button.config(state="normal")
            self.start_button.config(state="normal")
            self.port_combo.config(state="disabled")
        except Exception as exc:
            self.serial_port = None
            messagebox.showerror("Connection failed", str(exc))

    def disconnect_serial(self):
        if self.recording or self.stopping:
            messagebox.showwarning(
                "Recording active",
                "Press Stop & Save before disconnecting."
            )
            return

        self.reader_running = False
        try:
            if self.serial_port and self.serial_port.is_open:
                self.serial_port.close()
        except Exception:
            pass
        self.serial_port = None

        self.status_var.set("Not connected")
        self.connect_button.config(state="normal")
        self.disconnect_button.config(state="disabled")
        self.start_button.config(state="disabled")
        self.stop_button.config(state="disabled")
        self.port_combo.config(state="readonly")

    def serial_reader(self):
        while self.reader_running and self.serial_port:
            try:
                raw_line = self.serial_port.readline()
                if not raw_line:
                    continue
                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line.startswith("{"):
                    if line:
                        self.messages.put(("log", line))
                    continue
                try:
                    packet = json.loads(line)
                except json.JSONDecodeError:
                    self.messages.put(("log", "Received an incomplete JSON line; skipped."))
                    continue

                if packet.get("type") == "sample":
                    self.messages.put(("sample", packet))
            except Exception as exc:
                if self.reader_running:
                    self.messages.put(("error", str(exc)))
                break

    def start_recording(self):
        if not self.serial_port or not self.serial_port.is_open:
            messagebox.showwarning("Not connected", "Connect to the ESP32 first.")
            return

        label = self.label_var.get().strip()
        if not label:
            messagebox.showwarning(
                "Missing label", "Enter the Arabic letter or symbol before recording."
            )
            return
        if "," in label or "\n" in label or "\r" in label:
            messagebox.showwarning(
                "Invalid label", "The label cannot contain commas or line breaks."
            )
            return

        try:
            self.samples = []
            self.sample_count = 0
            self.current_label = label
            self.stopping = False
            self.recording = True

            command = f"D,{label}\n".encode("utf-8")
            self.serial_port.write(command)
            self.serial_port.flush()

            self.status_var.set(f"RECORDING: {label} — perform the gesture now")
            self.count_var.set("Samples collected: 0")
            self.start_button.config(state="disabled")
            self.stop_button.config(state="normal")
            self.label_entry.config(state="disabled")
        except Exception as exc:
            self.recording = False
            messagebox.showerror("Could not start recording", str(exc))

    def stop_recording(self):
        if not self.recording or not self.serial_port:
            return
        try:
            self.stopping = True
            self.recording = False
            self.serial_port.write(b"X\n")
            self.serial_port.flush()
            self.status_var.set("Stopping… waiting for the final sensor packet")
            self.stop_button.config(state="disabled")
            # Allow a short grace period for the last USB serial packet.
            self.root.after(350, self.finish_and_save)
        except Exception as exc:
            self.stopping = False
            messagebox.showerror("Stop failed", str(exc))

    def packet_to_row(self, packet):
        flex_raw = packet.get("flex_raw")
        bend_pct = packet.get("bend_pct")
        imu = packet.get("imu")

        if not isinstance(flex_raw, list) or len(flex_raw) != 5:
            return None
        if not isinstance(bend_pct, list) or len(bend_pct) != 5:
            return None
        if not isinstance(imu, dict):
            imu = {}

        row = {
            "label": self.current_label,
            "hand": packet.get("hand", "right"),
            "time_ms": packet.get("time_ms", ""),
            "computer_time": datetime.now().isoformat(timespec="milliseconds"),
            "calibrated": packet.get("calibrated", False)
        }

        for i, name in enumerate(FLEX_NAMES):
            row[f"{name}_raw"] = flex_raw[i]
            row[f"{name}_bend_pct"] = bend_pct[i]

        for name in IMU_NAMES:
            row[name] = imu.get(name, "")

        return row

    def process_messages(self):
        try:
            while True:
                kind, payload = self.messages.get_nowait()
                if kind == "sample":
                    self.handle_sample(payload)
                elif kind == "log":
                    # Keep diagnostic output out of the dataset.
                    pass
                elif kind == "error":
                    self.status_var.set(f"Serial error: {payload}")
        except queue.Empty:
            pass
        self.root.after(100, self.process_messages)

    def handle_sample(self, packet):
        flex = packet.get("flex_raw", [])
        if isinstance(flex, list) and len(flex) == 5:
            self.last_data_var.set(
                "Latest RAW — "
                + " | ".join(
                    f"{name.title()}: {value}"
                    for name, value in zip(FLEX_NAMES, flex)
                )
            )

        if not self.recording and not self.stopping:
            return

        # Accept any recording=true packets already queued when Stop was pressed.
        if packet.get("recording") is not True:
            return

        packet_label = packet.get("label", "")
        if packet_label and packet_label != self.current_label:
            return

        row = self.packet_to_row(packet)
        if row is not None:
            self.samples.append(row)
            self.sample_count += 1
            self.count_var.set(f"Samples collected: {self.sample_count}")

    def finish_and_save(self):
        self.stopping = False
        self.start_button.config(state="normal" if self.serial_port else "disabled")
        self.label_entry.config(state="normal")

        if not self.samples:
            self.status_var.set("No samples captured")
            messagebox.showwarning(
                "No samples saved",
                "No recording=true sensor packets were received.\n\n"
                "Check that the glove switch is ON, the USB COM port is correct, "
                "and the ESP32 is running the supplied firmware."
            )
            return

        default_name = (
            f"HandiVoice_{self.safe_filename(self.current_label)}_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        )
        path = filedialog.asksaveasfilename(
            title="Save gesture dataset",
            defaultextension=".csv",
            initialfile=default_name,
            filetypes=[("CSV files", "*.csv")]
        )

        if not path:
            self.status_var.set(
                f"Recording stopped — {len(self.samples)} samples not yet saved"
            )
            if messagebox.askyesno(
                "Save samples?",
                "You cancelled the save dialog. Do you want to discard these samples?"
            ):
                self.samples = []
                self.count_var.set("Saved samples in this recording: 0")
            else:
                self.root.after(100, self.finish_save_again)
            return

        self.write_csv(path)

    def finish_save_again(self):
        default_name = (
            f"HandiVoice_{self.safe_filename(self.current_label)}_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        )
        path = filedialog.asksaveasfilename(
            title="Save gesture dataset",
            defaultextension=".csv",
            initialfile=default_name,
            filetypes=[("CSV files", "*.csv")]
        )
        if path:
            self.write_csv(path)
        else:
            self.status_var.set("Samples remain in memory; they are not saved to disk.")

    @staticmethod
    def safe_filename(label):
        return "".join(
            ch if ch.isalnum() or ch in ("-", "_") else "_"
            for ch in label
        ) or "gesture"

    def write_csv(self, path):
        try:
            with open(path, "w", newline="", encoding="utf-8-sig") as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=CSV_FIELDS)
                writer.writeheader()
                writer.writerows(self.samples)

            count = len(self.samples)
            self.status_var.set(f"Saved successfully: {count} samples")
            messagebox.showinfo(
                "Dataset saved",
                f"Saved {count} samples successfully.\n\n{path}"
            )
            self.samples = []
            self.count_var.set("Saved samples in this recording: 0")
            self.current_label = ""
        except Exception as exc:
            messagebox.showerror("Save failed", str(exc))
            self.status_var.set("Save failed — samples are still in memory")

    def on_close(self):
        if self.recording or self.stopping:
            if not messagebox.askyesno(
                "Exit while recording",
                "A recording is active. Stop the recording and exit?"
            ):
                return
            try:
                if self.serial_port and self.serial_port.is_open:
                    self.serial_port.write(b"X\n")
                    self.serial_port.flush()
            except Exception:
                pass

        self.reader_running = False
        try:
            if self.serial_port and self.serial_port.is_open:
                self.serial_port.close()
        except Exception:
            pass
        self.root.destroy()


if __name__ == "__main__":
    root = tk.Tk()
    app = HandiVoiceRecorder(root)
    root.mainloop()
