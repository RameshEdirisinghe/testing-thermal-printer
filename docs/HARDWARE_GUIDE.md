# ThermoDiagnostix Hardware Connection & Troubleshooting Guide

This guide details connecting physical thermal receipt printers (58 mm and 80 mm) via **Web Bluetooth (BLE)**, **WebUSB**, and **Browser Spooler Fallback**.

---

## 1. Web Bluetooth Low Energy (BLE)

### Prerequisites
- **Browser:** Google Chrome (v56+), Microsoft Edge (v79+), or Opera on desktop (Windows 10+, macOS, Linux) or Android.
- **Context:** Secure Context required (**HTTPS** or `http://localhost`).
- **Printer Hardware:** Must feature **Bluetooth 4.0+ BLE**.

> [!WARNING]
> **Bluetooth Classic vs BLE:**
> Many commercial thermal receipt printers (such as legacy POS-58, POS-80, or handheld Bluetooth printers) operate exclusively over **Bluetooth Classic 2.1 (SPP / Serial Port Profile)**. Web Bluetooth **cannot** connect to Bluetooth Classic SPP devices.
> 
> If your printer is Bluetooth Classic:
> 1. Pair it with the OS Bluetooth settings.
> 2. Install the virtual COM/SPP printer driver.
> 3. Use the **Browser Print Spooler** fallback mode in ThermoDiagnostix.

### Known BLE Service UUIDs
Thermal printers that support BLE advertise one of the following GATT Service UUIDs:
- `000018f0-0000-1000-8000-00805f9b34fb` — Standard Bluetooth SIG Printer Service
- `e7810a71-73ae-499d-8c15-faa9aef0c3f2` — Common ESC/POS BLE Service (POS-58 / POS-80)
- `49535343-fe7d-4ae5-8fa9-9fafd205e455` — ISSC Transparent UART (Microchip/ISSC)
- `0000fee7-0000-1000-8000-00805f9b34fb` — Tencent / IoT Standard Printer
- `0000ffe0-0000-1000-8000-00805f9b34fb` — HM-10 UART BLE Module

### BLE MTU & Packet Pacing
GATT write characteristics restrict packet sizes (typically 20 to 128 bytes). Sending excessive data without pacing causes printer buffer overflows and corrupted output.
- **Recommended MTU Chunk Size:** 64 bytes
- **Recommended Pacing Delay:** 10 ms to 20 ms between chunks

---

## 2. WebUSB Connectivity

### Prerequisites
- **Browser:** Google Chrome (v61+), Microsoft Edge (v79+), or Opera.
- **Context:** Secure Context (**HTTPS** or `http://localhost`).

### Windows Setup (WinUSB Driver Requirement)
On Windows, when you plug in a USB thermal printer, Windows automatically attaches its proprietary **USB Printing Support (`usbprint.sys`)** driver. This kernel driver claims exclusive control, preventing Chrome/Edge from accessing the device.

To use direct WebUSB on Windows:
1. Download **Zadig** from [https://zadig.akeo.ie](https://zadig.akeo.ie).
2. Launch Zadig and select **Options &rarr; List All Devices**.
3. In the dropdown, select your thermal printer (e.g. *POS-80*, *POS-58*, *Epson TM-T20*, or *Generic USB Printer*).
4. Verify the driver to be installed is set to **WinUSB**.
5. Click **Replace Driver** (or **Install Driver**).
6. Return to ThermoDiagnostix and click **Connect USB**.

### macOS & Linux Setup
- **macOS:** WebUSB works out-of-the-box if no native CUPS printer driver has claimed exclusive control.
- **Linux:** Requires udev permissions. Add a udev rule in `/etc/udev/rules.d/99-thermal-printer.rules`:
  ```bash
  SUBSYSTEM=="usb", ATTR{idVendor}=="0416", MODE="0666"
  ```
  (Replace `0416` with your printer's USB Vendor ID).

---

## 3. Browser Print Spooler Fallback

When direct Web Bluetooth or WebUSB is unavailable:
1. Ensure the printer is installed in your operating system with its native manufacturer or generic text-only print driver.
2. Click **Use Browser Spooler** in ThermoDiagnostix.
3. The layout automatically adopts print-optimized CSS (`@media print`) matching 58 mm or 80 mm dimensions.
4. Set margins to **None** and Paper Size to **Receipt** in the browser print dialog.

---

## 4. Manual Hardware Verification Checklist

Follow this checklist when testing on physical hardware:
- [ ] **Paper Roll Seated Correctly:** Thermal side facing the thermal head (scratch with fingernail; black streak indicates thermal side).
- [ ] **Platen Roller Latched:** Lid closed firmly until audible click.
- [ ] **Status LED:** Solid green or blue (no blinking red paper-out or error LED).
- [ ] **Test B (Basic Text):** Confirm text prints from left edge without clipping on the right.
- [ ] **Test C (Width & Alignment):** Inspect ruler lines to ensure column count (32 or 48) matches paper margins.
- [ ] **Test E (1D Barcode):** Scan barcode with a smartphone camera or 1D barcode scanner.
- [ ] **Test F (2D QR Code):** Scan QR code with mobile phone camera and confirm URL decoding.
- [ ] **Test H (Auto Cutter):** Confirm physical cut cleanly divides receipt without blade binding.
