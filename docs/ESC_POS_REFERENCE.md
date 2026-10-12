# ESC/POS Command Engine Reference

ThermoDiagnostix generates standards-compliant raw ESC/POS byte sequences without external proprietary driver binaries.

---

## Command Byte Specifications

| Command | Hex Bytes | Description | Standard |
| :--- | :--- | :--- | :--- |
| **Initialize Printer** | `1B 40` (`ESC @`) | Clears print buffer, resets modes to default | Standard ESC/POS |
| **Line Feed** | `0A` (`LF`) | Prints buffer content and feeds one line | Standard ESC/POS |
| **Feed N Lines** | `1B 64 [n]` (`ESC d n`) | Feeds `n` lines | Standard ESC/POS |
| **Text Alignment** | `1B 61 [n]` (`ESC a n`) | 0 = Left, 1 = Center, 2 = Right | Standard ESC/POS |
| **Bold Emphasis** | `1B 45 [n]` (`ESC E n`) | 1 = Bold On, 0 = Bold Off | Standard ESC/POS |
| **Underline** | `1B 2D [n]` (`ESC - n`) | 0 = Off, 1 = 1-dot, 2 = 2-dot | Standard ESC/POS |
| **Invert Text** | `1D 42 [n]` (`GS B n`) | 1 = White on Black, 0 = Normal | Standard ESC/POS |
| **Character Size** | `1D 21 [n]` (`GS ! n`) | `(widthMult - 1) << 4 \| (heightMult - 1)` | Standard ESC/POS |
| **Select Font** | `1B 4D [n]` (`ESC M n`) | 0 = Font A (12x24), 1 = Font B (9x17) | Standard ESC/POS |
| **Partial Cut** | `1D 56 01` (`GS V 1`) | Performs partial cut (leaving tab) | Standard ESC/POS |
| **Full Cut** | `1D 56 00` (`GS V 0`) | Performs full paper cut | Standard ESC/POS |
| **Status Query** | `10 04 [n]` (`DLE EOT n`) | Real-time status query (1=Printer, 2=Offline, 4=Paper) | Bidirectional ESC/POS |

---

## 1D Barcode Commands (`GS k`)

ThermoDiagnostix utilizes **ESC/POS Barcode System B**:
- Syntax: `1D 6B [m] [n] [d1...dn]`
- `m = 73`: CODE128
- `m = 69`: CODE39
- `m = 67`: EAN13
- `m = 68`: EAN8
- `m = 65`: UPC-A
- `m = 66`: UPC-E
- `m = 70`: ITF

### Barcode Configuration Parameters
- **Height:** `1D 68 [n]` (Height in dots: 1 to 255)
- **Width:** `1D 77 [n]` (Module width: 2 to 6)
- **HRI Position:** `1D 48 [n]` (0 = None, 1 = Above, 2 = Below, 3 = Both)
- **HRI Font:** `1D 66 [n]` (0 = Font A, 1 = Font B)

---

## 2D QR Code Commands (`GS ( k`)

ESC/POS 2D QR Code sequence:
1. **Model Selection:** `1D 28 6B 04 00 31 41 32 00` (Function 165: Model 2)
2. **Module Size:** `1D 28 6B 03 00 31 43 [size]` (Function 167: 1 to 16 dots)
3. **Error Correction:** `1D 28 6B 03 00 31 45 [ec]` (Function 169: 48=L, 49=M, 50=Q, 51=H)
4. **Store Data:** `1D 28 6B [pL] [pH] 31 50 30 [data...]` (Function 180)
5. **Print Symbol:** `1D 28 6B 03 00 31 51 30` (Function 181)

---

## Paper Width & Character Geometry

| Paper Width | Printable Dots | Font A (12x24 dots) | Font B (9x17 dots) | Typical Uses |
| :--- | :--- | :--- | :--- | :--- |
| **58 mm (~2.25")** | 384 dots | **32 columns** | **42 columns** | Mobile, handheld, mini POS |
| **80 mm (~3.125")** | 576 dots | **48 columns** | **64 columns** | Kitchen, retail, supermarket |

---

## Character Encodings, Code Pages & Unicode / Sinhala Considerations

### 1. ASCII and Hardware Code Pages
Standard thermal receipt printers operate on 8-bit character sets:
- **0x20 to 0x7E:** Standard 7-bit ASCII (Latin letters, digits, standard punctuation).
- **0x80 to 0xFF:** Extended characters mapped by the active **Hardware Code Page** (`ESC t n`):
  - `ESC t 0` (Code Page 437): Standard US / Western European OEM characters.
  - `ESC t 2` (Code Page 850): Multilingual Latin I.
  - `ESC t 16` (Windows-1252): Western European Latin.
  - `ESC t 255`: Custom user-defined code page.

### 2. Arbitrary Unicode & Complex Scripts (e.g. Sinhala, Tamil, Arabic)
Thermal receipt printers do not possess a universal Unicode font engine or OpenType glyph shaper in firmware:
- Complex Indic scripts such as **Sinhala** (සිංහල) and Tamil use vowel signs (kombuva, hal lakuna) that require complex contextual shaping and reordering.
- Raw ESC/POS byte streams cannot directly render arbitrary multi-byte UTF-8 Unicode characters unless the printer has manufacturer firmware specifically burned with a localized code page (e.g., custom vendor ROM).
- **Solutions for Sinhala and Complex Unicode:**
  1. **Raster Bit Image Printing:** Render the text to an HTML `<canvas>` element in the web browser, convert the raster canvas image to ESC/POS monochrome bitmap commands (`GS v 0` or `ESC *`), and print the graphic.
  2. **Browser Print Spooler Mode:** Use ThermoDiagnostix's built-in **Browser Print Spooler** fallback mode, where the browser and operating system font rasterizer render full Unicode and Sinhala scripts at native printhead resolution.
