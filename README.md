# ThermoDiagnostix

> **Professional Thermal Receipt Printer Diagnostic & Testing Web Application**
> Built with React, TypeScript, Vite, Tailwind CSS, Web Bluetooth (BLE), WebUSB, and Vitest.

---

## Overview

**ThermoDiagnostix** is an enterprise-grade hardware diagnostic suite designed to test, validate, and troubleshoot 58 mm and 80 mm ESC/POS thermal receipt printers directly from modern web browsers. It eliminates external native print driver wrappers by speaking raw byte protocols over **Web Bluetooth Low Energy (BLE)** and **WebUSB**, while providing an automated **Browser Print Spooler** fallback.

---

## Key Features

1. **Enterprise Hardware Diagnostics (Tests A through J):**
   - **Test A:** Connection & Communication Handshake Verification.
   - **Test B:** Basic Text, Timestamps, Alignment, and Character Sets.
   - **Test C:** Paper Width & Alignment Rulers (58 mm vs 80 mm margin boundaries).
   - **Test D:** Text Formatting (Bold, Underline, Invert, Double-Height, Double-Width, 2x2 Expand).
   - **Test E:** 1D Barcode Print & Validation (CODE128, CODE39, EAN13 with checksum calculation).
   - **Test F:** 2D QR Code Generation (`GS ( k` Model 2 with configurable Error Correction).
   - **Test G:** Paper Feed Tractions (Configurable platen advance).
   - **Test H:** Mechanical Auto-Cutter Test (with profile capability detection & safety confirmation modal).
   - **Test I:** Real-time Hardware Status Query (`DLE EOT` Paper Out, Cover Open, Offline flags).
   - **Test J:** Stress & Reliability Suite (Repetitive print sequences with buffer pacing & disconnect safety).

2. **Real Hardware Connectivity:**
   - **Web Bluetooth BLE:** GATT Server connection, service/characteristic discovery, MTU chunking (64 bytes default), and packet pacing delay to prevent buffer overruns.
   - **WebUSB API:** Direct USB bulk OUT transfers to interface endpoints, device configuration selection, safe interface claim and release.
   - **Browser Spooler Fallback:** Dedicated print layout styled with `@media print` CSS for standard OS print queues.
   - **Virtual Hardware Simulator:** Complete mock transport engine with simulated latency and packet capture for offline verification and testing.

3. **Receipt Preview & Byte Inspector:**
   - Realistic thermal paper preview matching authentic 58 mm and 80 mm dimensions.
   - **Hex Dump:** Offset, hex bytes, and ASCII representation.
   - **ESC/POS Command Inspector:** Real-time bytecode disassembly into human-readable mnemonics (`[ESC @]`, `[ESC a 1]`, `[GS k]`).
   - **Interactive Receipt Customizer:** Edit store headers, dynamic line items, totals, barcodes, QR codes, and feed lines.

4. **Honest Test & Physical Verification Pipeline:**
   - Rigorously distinguishes **Transport-Level Transmission** from **Physical Output Verification**.
   - Operator verification modal prompts users to inspect printed slips and record notes.
   - Real-time activity log with severity levels (Info, Success, Warn, Error).
   - One-click export of diagnostic audit reports in **JSON** or **Formatted TXT**.

---

## Architecture

```
src/
├── components/          # Dashboard cards, modals, preview, & print layouts
├── diagnostics/         # Diagnostic test definitions (A - J) & test runner
├── escpos/              # Low-level ESC/POS bytecode generator, formatter & barcodes
├── icons/               # Zero-dependency SVG icons (Lucide compatible)
├── profiles/            # 58mm & 80mm printer hardware profiles & persistent store
├── transports/          # Common transport interface (BLE, USB, Spooler, Mock) & FIFO Queue
├── types/               # TypeScript interfaces and domain models
└── utils/               # Browser detection, hex formatting, and report exporters
```

---

## Browser & Platform Compatibility

| Feature | Chrome / Edge (Desktop) | Chrome (Android) | Safari (macOS / iOS) | Firefox |
| :--- | :---: | :---: | :---: | :---: |
| **Web Bluetooth (BLE)** | **Supported** (HTTPS/localhost) | **Supported** | Unsupported | Unsupported |
| **WebUSB** | **Supported** (HTTPS/localhost) | **Supported** | Unsupported | Unsupported |
| **Browser Print Fallback** | **Supported** | **Supported** | **Supported** | **Supported** |
| **Hardware Simulator** | **Supported** | **Supported** | **Supported** | **Supported** |

*Note: For Windows USB printers, Windows assigns `usbprint.sys` by default. To enable direct WebUSB, replace the driver with **WinUSB** using the free utility [Zadig](https://zadig.akeo.ie). See [docs/HARDWARE_GUIDE.md](docs/HARDWARE_GUIDE.md) for full instructions.*

---

## Installation & Startup

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone or navigate to the project directory
cd d:/testprinit

# Install project dependencies
npm install
```

### Development Server
```bash
# Start local development server with hot reload
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in Google Chrome or Microsoft Edge.

### Running Unit & Integration Tests
```bash
# Execute Vitest test suite
npm test

# Run tests with code coverage
npm run test:coverage
```

### Running End-to-End Tests
```bash
# Execute Playwright E2E browser tests
npm run test:e2e
```

### Production Build
```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Documentation Links

- **Browser Compatibility & Hardware Transports:** [docs/BROWSER_COMPATIBILITY.md](docs/BROWSER_COMPATIBILITY.md)
- **Hardware Connection & Troubleshooting Guide:** [docs/HARDWARE_GUIDE.md](docs/HARDWARE_GUIDE.md)
- **Detailed Troubleshooting Instructions:** [docs/HARDWARE_TROUBLESHOOTING.md](docs/HARDWARE_TROUBLESHOOTING.md)
- **Manual Hardware Verification Checklist:** [docs/MANUAL_TESTING_CHECKLIST.md](docs/MANUAL_TESTING_CHECKLIST.md)
- **ESC/POS Command Specifications:** [docs/ESC_POS_REFERENCE.md](docs/ESC_POS_REFERENCE.md)
