# Manual Verification Checklist for Physical Thermal Printers

This document provides a systematic physical verification protocol for QA Automation Engineers, Hardware Specialists, and Field Technicians validating 58 mm and 80 mm ESC/POS thermal receipt printers using **ThermoDiagnostix**.

---

## 1. Pre-Flight Physical Hardware Inspection

Before launching software print tests:

- [ ] **Power Supply Voltage & Current:**
  - 58 mm desktop/portable: Verify rated voltage (typically 8.5V–12V DC, minimum 1.5A).
  - 80 mm POS printer: Verify rated voltage (typically 24V DC, minimum 2.0A–2.5A).
  - Power indicator LED is solid green/blue without flickering.
- [ ] **Thermal Paper Roll Verification:**
  - Check roll width matches the hardware specification: 57 mm &plusmn; 0.5 mm or 79.5 mm &plusmn; 0.5 mm.
  - Thermal coating scratch test: Scratch paper with fingernail to confirm thermal coating is on the side facing the heating line.
  - Roll seated straight in paper cradle with tension guide correctly positioned.
- [ ] **Platen Roller & Lid Latch:**
  - Close the printer cover firmly until both sides engage with an audible click.
  - Confirm paper feeds freely when depressing the physical `FEED` button on the printer casing.
- [ ] **Hardware Status LEDs:**
  - Power LED: Solid ON.
  - Error LED: OFF (not blinking red/orange, indicating cover open, paper out, or cutter jam).

---

## 2. Test Execution & Physical Output Verification Protocol

Execute tests individually from the **ThermoDiagnostix Diagnostic Test Suite** and inspect the printed paper slip against the criteria below:

### Test A: Connection & Channel Handshake
- [ ] **Category:** Transport Handshake (No physical printout expected).
- [ ] **Verification:** Confirms transport is active, device name and ID are reported, and bidirectional channel capabilities are determined.
- [ ] **Result:** Record status as **PASSED** in ThermoDiagnostix dashboard.

---

### Test B: Basic Text Print Test
- [ ] **Visual Appearance:**
  - Header text `"THERMODIAGNOSTIX BASIC TEXT TEST"` is centered and crisp.
  - Device Name, Transport type, and Timestamp are clearly readable without smearing.
  - Alignment samples:
    - `"Left-aligned sample text"` is flush against the left printable margin.
    - `"Centered sample text"` is positioned symmetrically across the paper width.
    - `"Right-aligned sample text"` ends flush against the right margin without trailing character truncation.
  - Numbers `0123456789` and punctuation symbols print with distinct glyph separation.
- [ ] **Pass Criteria:** No missing lines, character wrapping, or thermal fading.

---

### Test C: Paper Width & Alignment Test
- [ ] **Visual Appearance:**
  - Column Ruler Line 1 shows index markers (`.`, `+`, `1`, `2`, `3`, `4`).
  - Column Ruler Line 2 shows digit units (`1234567890...`).
  - Ruler character count matches the active profile width:
    - 58 mm: Exactly 32 characters across Font A.
    - 80 mm: Exactly 48 characters across Font A.
  - Boundary line: Bracket `[` is on the left edge and `]` is on the right edge without wrapping onto a second line.
- [ ] **Physical Measurement:**
  - Inspect physical margins with a metric ruler. Verify horizontal margins are balanced (typically 3–4 mm on each side).
- [ ] **Pass Criteria:** Long boundary rules do not overflow onto extra blank or fragmented lines.

---

### Test D: Text Formatting & Emphasis Test
- [ ] **Visual Appearance:**
  - Standard text is crisp 12x24 dots.
  - Bold line has visibly heavier ink/burn saturation compared to standard text.
  - Underline 1-dot has a single continuous line beneath characters.
  - Underline 2-dot has a thick 2-dot underline.
  - Inverted text shows white lettering on a solid black rectangular background without thermal streaking.
  - Double Height is vertically stretched (24 &rarr; 48 dots) with normal width.
  - Double Width is horizontally expanded with standard height.
  - Double 2x2 is 4x the area of normal text.
  - Font B line prints noticeably smaller, compact 9x17 font.
- [ ] **Pass Criteria:** All formatting modes render distinctly and revert cleanly to normal text without residual styles.

---

### Test E: 1D Barcode Test
- [ ] **Visual Appearance:**
  - Barcode symbol (CODE128) is printed dark and sharp without broken vertical bars or bleeding lines.
  - Human-readable text (`TEST-128-OK`) is printed legibly beneath the barcode bars.
- [ ] **Optical Scan Verification:**
  - Scan the printed barcode using a physical 1D laser/CCD scanner or smartphone barcode scanner app.
  - Confirm decoded string matches `"TEST-128-OK"`.
- [ ] **Pass Criteria:** Successful scan decode on first attempt from 10–15 cm distance.

---

### Test F: 2D QR Code Test
- [ ] **Visual Appearance:**
  - 2D QR matrix is printed with sharp square dots and clear position finder patterns in three corners.
  - Plaintext URL string is printed below the code.
- [ ] **Optical Scan Verification:**
  - Point a smartphone camera at the printed QR code.
  - Confirm the camera recognizes the code and displays the test URL (`https://thermodiagnostix.dev`).
- [ ] **Pass Criteria:** Instant camera recognition within 2 seconds under standard room lighting.

---

### Test G: Paper Feed Test
- [ ] **Physical Action:**
  - Platen motor advances paper forward by exactly 5 blank line increments.
  - Paper advances straight without skewing or wrinkling against the paper guide.
- [ ] **Pass Criteria:** Smooth motorized feed without audible grinding or paper slip.

---

### Test H: Auto Cutter Test (Where Supported)
*Caution: Only test on models equipped with an automatic motorized cutter.*
- [ ] **Physical Action:**
  - Printer feeds configured margin lines.
  - Mechanical guillotine or rotary blade activates cleanly.
  - For Partial Cut: Receipt paper is cleanly severed across 90–95% of width, leaving a small 2–5 mm uncut tab holding the slip.
  - For Full Cut: Receipt drops or separates completely.
- [ ] **Pass Criteria:** Clean cut without blade stall, paper tear, or blade retraction jam.

---

### Test I: Real-time Status Query Test
- [ ] **Verification:**
  - Normal State: Dashboard reports `Paper OK`, `Online`.
  - Paper-Out Sensor Test: Open the lid, remove the paper roll, close lid with paper depleted, and run Test I.
  - Dashboard must report `Paper Out` or `Offline`.
- [ ] **Pass Criteria:** Hardware sensors reflect physical status accurately or report "Not supported" if transport does not support bidirectional DLE EOT reads.

---

### Test J: Stress & Reliability Test
- [ ] **Physical Action:**
  - Execute 3 to 5 repetitive test iterations.
  - Monitor paper feeding continuously with consistent pacing (300 ms delays).
  - Inspect each receipt slip: verify sequential numbering (`Iteration 1/3`, `Iteration 2/3`, `Iteration 3/3`).
  - Thermal head check: Verify thermal head temperature does not cause thermal fading or uneven contrast across slips.
- [ ] **Pass Criteria:** All iterations print cleanly with zero dropped packets, buffer corruptions, or communication timeouts.

---

## 3. Post-Test Audit & Session Archive

After completing physical inspection:

1. In ThermoDiagnostix, click **Verify Output** for each test awaiting physical review.
2. Select **Confirm Passed** (or **Mark Failed** with specific defect notes).
3. In the **Live Diagnostic Activity Log**, click **TXT Report** or **JSON** to download the complete diagnostic audit trail.
4. Archive the digital report file alongside high-resolution photos of the physical test slips for quality assurance records.
