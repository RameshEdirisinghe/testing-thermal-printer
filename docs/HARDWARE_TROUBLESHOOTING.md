# Hardware Connection & Troubleshooting Instructions

This document provides in-depth hardware troubleshooting instructions for connecting, diagnosing, and resolving physical issues with 58 mm and 80 mm ESC/POS thermal receipt printers across **Web Bluetooth (BLE)**, **WebUSB**, and the **Browser Print Spooler Fallback**.

---

## 1. Web Bluetooth (BLE) Hardware Troubleshooting

### Symptom: Printer not appearing in browser Bluetooth selection chooser
* **Root Cause 1: Printer is Bluetooth Classic only (SPP / RFCOMM)**
  * *Explanation:* Web Bluetooth only scans for Bluetooth Low Energy (BLE 4.0+) devices. Many legacy thermal printers (e.g., standard POS-58 or POS-80 portable models) only broadcast Bluetooth Classic 2.1 SPP.
  * *Resolution:* Pair the printer with your operating system's Bluetooth settings, install the manufacturer's virtual COM/SPP driver, and use ThermoDiagnostix's **Browser Print Spooler** fallback mode.
* **Root Cause 2: Device already connected to another host**
  * *Explanation:* Most BLE peripheral microcontrollers (e.g. HM-10, ISSC) support only one active GATT connection at a time.
  * *Resolution:* Turn off Bluetooth on any previously paired mobile phones or tablets, or power cycle the printer.
* **Root Cause 3: Insecure Context**
  * *Explanation:* `navigator.bluetooth` is blocked in insecure contexts.
  * *Resolution:* Ensure your URL is `https://` or `http://localhost`. Browsing via LAN IP (`http://192.168.x.x:5173`) will disable Web Bluetooth.
* **Root Cause 4: Missing Custom Service UUID**
  * *Explanation:* The printer may advertise a vendor-specific proprietary primary GATT service not included in the standard filter list.
  * *Resolution:* In ThermoDiagnostix, click **Configure Custom UUIDs** on the Bluetooth connection card and enter the manufacturer's GATT service UUID (e.g. `e7810a71-73ae-499d-8c15-faa9aef0c3f2` or `49535343-fe7d-4ae5-8fa9-9fafd205e455`).

### Symptom: Connected to GATT Server, but error "No writable BLE characteristic found"
* *Explanation:* The device connected, but none of its GATT characteristics expose `write` or `writeWithoutResponse` properties, or the writable characteristic resides in a secondary vendor service.
* *Resolution:* Consult the printer's programming manual for the exact writable characteristic UUID, and specify it in the **Custom Characteristic UUID** field in ThermoDiagnostix.

### Symptom: Printout is clipped, characters are dropped, or printer freezes mid-receipt
* *Explanation:* GATT write buffer overflow. BLE microcontrollers have limited packet RAM (often 64 to 256 bytes).
* *Resolution:* In ThermoDiagnostix **Profile Settings**, lower the **BLE MTU Chunk Size** (e.g., reduce from 64 to 32 or 20 bytes) and increase the **BLE Pacing Delay** (e.g., from 15 ms to 25 ms).

---

## 2. WebUSB Hardware Troubleshooting

### Symptom: Device selection chooser opens, printer is selected, but error: "Unable to claim interface" (Windows)
* *Root Cause:* Exclusive kernel driver lock by `usbprint.sys`.
* *Explanation:* Windows automatically attaches its proprietary USB Printing Support driver (`usbprint.sys`) whenever an ESC/POS printer is plugged in. This driver claims interface 0 exclusively, preventing the browser's WebUSB stack from opening or claiming the bulk OUT endpoint.
* *Resolution:*
  1. Download and run **Zadig** ([https://zadig.akeo.ie](https://zadig.akeo.ie)).
  2. In Zadig, select **Options &rarr; List All Devices**.
  3. Select your thermal printer from the dropdown list.
  4. Change the target driver to **WinUSB**.
  5. Click **Replace Driver** (or **Install Driver**).
  6. Return to ThermoDiagnostix, refresh, and click **Connect USB**.
* *Note on Rollback:* If you later need to use standard Windows printer drivers, open Device Manager, right-click the printer under *Universal Serial Bus devices*, select *Uninstall device*, check *Delete driver software*, and reconnect the USB cable.

### Symptom: Linux: Error "Access denied" or "Failed to open device"
* *Root Cause:* Missing udev permissions for raw USB endpoint communication.
* *Resolution:*
  1. Determine your printer's USB Vendor ID (VID) using `lsusb`.
  2. Create a udev rule: `/etc/udev/rules.d/99-thermal-printer.rules`:
     ```bash
     SUBSYSTEM=="usb", ATTR{idVendor}=="[YOUR_VID]", MODE="0666"
     ```
  3. Reload rules:
     ```bash
     sudo udevadm control --reload-rules && sudo udevadm trigger
     ```

### Symptom: USB printer sends data, but nothing prints
* *Root Cause 1: Interface alternate setting mismatch*
  * *Resolution:* ThermoDiagnostix automatically inspects all interface alternates and claims bulk OUT endpoints. Check the activity log to confirm that the selected endpoint is indeed a Bulk OUT endpoint.
* *Root Cause 2: Power supply insufficient*
  * *Resolution:* Thermal printheads require high surge currents (1.5A to 2.5A at 8.5V–24V). Running on an unpowered USB port or failing 12V/24V power adapter causes the printhead heating elements to fail silently while the logic board still responds. Check the printer's power brick indicator light.

---

## 3. Physical Printhead & Paper Mechanics Troubleshooting

### Symptom: Paper feeds continuously with blank output
* *Root Cause:* Thermal paper roll inserted upside down.
* *Explanation:* Thermal paper is chemically coated on only one side.
* *Diagnostic Test:* Scratch the paper surface with your fingernail. A dark friction streak confirms the thermal side. Ensure the thermal side faces the thermal head (usually facing down into the well or towards the platen roller).

### Symptom: Paper jams during Auto-Cutter Test (Test H)
* *Root Cause 1: Cutter blade binding or sticky paper dust accumulation.*
  * *Resolution:* Turn off printer power. If the blade is stuck halfway, look for the manual blade retraction gear (often located behind a small plastic cover on the front panel). Turn the gear until the blade retracts. Clean paper path with an alcohol swab.
* *Root Cause 2: Printer does not possess a mechanical cutter.*
  * *Resolution:* 58 mm printers and low-cost desktop printers typically possess manual tear-bars rather than motorized guillotine/rotary cutters. In ThermoDiagnostix **Profile Settings**, verify that **Supports Auto-Cutter** is set to `false` for cutterless models.

### Symptom: Print is faint, broken, or has vertical blank streaks
* *Root Cause 1: Dirty thermal printhead.*
  * *Resolution:* Turn off power, open the lid, and gently wipe the dark thermal line with a lint-free swab moistened with 99% isopropyl alcohol. Allow 1 minute to dry before closing.
* *Root Cause 2: Head platen latch loose.*
  * *Resolution:* Ensure both left and right sides of the cover click securely shut. If the platen roller does not press firmly against the thermal head, heat transfer fails.

---

## 4. ESC/POS Command & Character Encoding Issues

### Symptom: Barcodes (Test E) or QR Codes (Test F) print as garbled raw text (e.g. `[GS k 73 8 ...]`)
* *Root Cause:* Printer firmware does not support ESC/POS System B barcode commands or standard `GS ( k` 2D QR functions.
* *Explanation:* Some budget Chinese microcontroller chips only support legacy 1D barcode commands (`ESC k`) or lack built-in 2D matrix rendering firmware.
* *Resolution:* Use the ThermoDiagnostix **Byte Inspector** to review command bytes. If hardware firmware does not support native QR codes, fallback to the **Browser Print Spooler** mode, which renders high-resolution graphic barcode symbols through the operating system print subsystem.

### Symptom: Extended characters (accented letters, currency signs) print as strange symbols
* *Root Cause:* Code page mismatch.
* *Resolution:* Standard ESC/POS defaults to Code Page 437 (USA). For European characters, use Code Page 850 or Windows-1252. Adjust the code page setting in the profile configuration or custom test builder.
