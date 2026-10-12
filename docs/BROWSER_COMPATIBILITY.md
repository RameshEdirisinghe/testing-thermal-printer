# Browser Compatibility & Hardware Transport Specifications

This document outlines the browser compatibility matrix, secure context requirements, hardware access constraints, and operating system driver considerations for **ThermoDiagnostix**.

---

## 1. Browser Compatibility Matrix

Direct communication with thermal receipt printers requires modern hardware access APIs (**Web Bluetooth** and **WebUSB**). When running in browsers without these APIs, ThermoDiagnostix provides an automated **Browser Print Spooler** fallback utilizing `window.print()` and custom ESC/POS-styled thermal CSS rules.

| Browser / Platform | Web Bluetooth (BLE) | WebUSB | Browser Print Fallback | Recommended Usage |
| :--- | :---: | :---: | :---: | :--- |
| **Google Chrome (Desktop)** <br> *(Windows 10+, macOS, Linux, ChromeOS)* | **Full Support** <br> (v56+) | **Full Support** <br> (v61+) | **Full Support** | **Primary / Best Experience** |
| **Microsoft Edge (Desktop)** <br> *(Windows 10+, macOS, Linux)* | **Full Support** <br> (v79+) | **Full Support** <br> (v79+) | **Full Support** | **Primary / Best Experience** |
| **Opera (Desktop)** <br> *(Windows, macOS, Linux)* | **Full Support** <br> (v43+) | **Full Support** <br> (v48+) | **Full Support** | Compatible |
| **Google Chrome (Android)** | **Full Support** <br> (Android 6.0+) | **Full Support** <br> (OTG Host Mode) | **Supported** | Supported for mobile testing |
| **Mozilla Firefox** <br> *(Desktop & Android)* | **Unsupported** <br> *(Standard declined by Mozilla)* | **Unsupported** <br> *(Standard declined by Mozilla)* | **Full Support** | Fallback to Browser Spooler |
| **Apple Safari (macOS)** | **Unsupported** <br> *(Standard declined by Apple)* | **Unsupported** <br> *(Standard declined by Apple)* | **Full Support** | Fallback to Browser Spooler |
| **iOS / iPadOS (All Browsers)** <br> *(Safari, Chrome, Firefox on WebKit)* | **Unsupported** <br> *(Requires specialized BLE app)* | **Unsupported** | **Full Support** <br> *(AirPrint / System Spooler)* | Fallback to Browser Spooler |

---

## 2. Secure Context Requirements

Both **Web Bluetooth** and **WebUSB** are classified as powerful browser hardware features and are strictly restricted to **Secure Contexts** by the W3C specifications:

- **Accepted Origins:**
  - `https://` (Valid SSL/TLS certificate, including self-signed certs trusted in your OS/browser store).
  - `http://localhost` or `http://127.0.0.1` (Designated secure origins for development and local testing).
- **Rejected Origins:**
  - Plain `http://` over LAN IPs (e.g., `http://192.168.1.100:5173/`).
  - Plain `http://` domain hostings.

> **Testing on LAN/Wi-Fi:** If accessing ThermoDiagnostix from another workstation or mobile tablet over your local area network, serve the application over HTTPS using a reverse proxy (e.g. Caddy, Nginx) or configure Chrome's `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.

---

## 3. Web Bluetooth (BLE) Constraints & Considerations

### Bluetooth Low Energy (BLE) vs Bluetooth Classic (SPP 2.1)
Thermal receipt printers in the market utilize two very different Bluetooth standards:

1. **Bluetooth Low Energy (BLE 4.0 / 4.2 / 5.0+):**
   - Communicates via GATT services, characteristics, and descriptors.
   - Fully accessible from Google Chrome and Microsoft Edge via `navigator.bluetooth.requestDevice()`.
   - Used by modern portable receipt printers, mobile mPOS printers, and dual-mode devices.
2. **Bluetooth Classic (RFCOMM / Serial Port Profile SPP):**
   - Legacy desktop and battery-operated printers (e.g. standard POS-58 or POS-80 Bluetooth dongles) often use Bluetooth Classic SPP.
   - **Important:** W3C Web Bluetooth **does not support Bluetooth Classic SPP**. Browsers cannot open raw RFCOMM sockets or virtual serial COM ports.
   - **Solution:** Pair the printer with your operating system, configure the vendor's virtual COM spooler or CUPS driver, and use ThermoDiagnostix's **Browser Print Spooler** fallback.

### MTU Packet Slicing and Pacing Delays
Unlike desktop operating systems with large ring buffers, BLE thermal printers have limited microcontroller RAM (often 256 bytes to 1 KB buffer).
- Sending ESC/POS byte streams all at once over GATT write characteristics can overflow the printer's receive buffer, leading to skipped lines or frozen printers.
- ThermoDiagnostix implements dynamic packet slicing (`chunkSize: 64 bytes` default) with configurable pacing (`pacingDelayMs: 15 ms`) and awaits `writeValueWithResponse` or throttles `writeValueWithoutResponse`.

---

## 4. WebUSB Hardware Access & Operating System Collisions

WebUSB allows web applications to communicate directly with USB devices via raw bulk OUT endpoints. However, an operating system driver can claim exclusive ownership of the USB interface:

### Windows (`usbprint.sys` Conflict)
- When a USB receipt printer is plugged into a Windows PC, Windows automatically binds `usbprint.sys` (USB Printing Support).
- Because `usbprint.sys` claims interface 0 exclusively, WebUSB throws: `NetworkError: Unable to claim interface.`
- **Remedy for Direct WebUSB on Windows:**
  1. Open **Zadig** ([zadig.akeo.ie](https://zadig.akeo.ie)).
  2. Select **Options -> List All Devices**.
  3. Select your thermal printer.
  4. Replace the driver with **WinUSB**.
  5. The printer will now be directly accessible by WebUSB.
  6. *Note:* Replacing with WinUSB disables the standard Windows spooler queue for that device. If you wish to retain standard Windows print jobs, keep `usbprint.sys` and use ThermoDiagnostix's **Browser Print Spooler** fallback.

### Linux (Permissions & udev Rules)
- Linux restricts access to raw USB devices to root by default.
- Create `/etc/udev/rules.d/99-thermal-printer.rules`:
  ```bash
  SUBSYSTEM=="usb", ATTR{idVendor}=="[YOUR_VENDOR_ID]", MODE="0666"
  ```
- Reload rules: `sudo udevadm control --reload-rules && sudo udevadm trigger`

### macOS (Driver Claiming)
- Modern macOS handles USB printers cleanly without requiring third-party driver switchers, provided the printer has not been captured exclusively by an active CUPS filter.

---

## 5. Browser Print Spooler Fallback Architecture

To ensure 100% testability across every browser (including Safari, Firefox, and mobile iOS) and compatibility with non-BLE Bluetooth Classic printers:

- ThermoDiagnostix includes a dedicated **Browser Spooler Mode**.
- Renders receipt diagnostics to a dedicated hidden container styled with `@media print`.
- Automatically dimensions the paper to exact physical sizes (58 mm / 80 mm) with zero page margins.
- Invokes native `window.print()` to route the formatted receipt to any installed system printer driver.

---

## 6. Compatibility Diagnostics Checklist

When diagnosing printer connectivity issues:

1. **Check Environment Banner:** The top bar will immediately display whether your browser is running in a Secure Context and whether Web Bluetooth / WebUSB APIs are present.
2. **Device Discovery:** If the device selection dialog does not show your device:
   - Verify device is powered ON and pairing mode is active.
   - For BLE: Ensure the device is not already paired exclusively to another tablet/phone.
   - For USB: Ensure the USB cable is connected directly (avoid unpowered USB hubs).
3. **Log Inspector:** Inspect the real-time event log for GATT error codes or USB claim errors.
