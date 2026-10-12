/**
 * ESC/POS standard control bytes and command constants
 */
export const CMD = {
  // Control Characters
  NUL: 0x00,
  EOT: 0x04,
  LF: 0x0A,
  FF: 0x0C,
  CR: 0x0D,
  DLE: 0x10,
  ESC: 0x1B,
  FS: 0x1C,
  GS: 0x1D,

  // Hardware Initialization
  INIT: [0x1B, 0x40], // ESC @

  // Line Spacing
  LINE_SPACING_DEFAULT: [0x1B, 0x32], // ESC 2 (1/6 inch)
  LINE_SPACING_SET: (n: number) => [0x1B, 0x33, Math.min(255, Math.max(0, n))], // ESC 3 n

  // Text Alignment: 0 = Left, 1 = Center, 2 = Right
  ALIGN: (n: 0 | 1 | 2) => [0x1B, 0x61, n],

  // Emphasis / Bold
  EMPHASIS_ON: [0x1B, 0x45, 0x01],
  EMPHASIS_OFF: [0x1B, 0x45, 0x00],

  // Underline: 0 = Off, 1 = 1-dot, 2 = 2-dot
  UNDERLINE_OFF: [0x1B, 0x2D, 0x00],
  UNDERLINE_1DOT: [0x1B, 0x2D, 0x01],
  UNDERLINE_2DOT: [0x1B, 0x2D, 0x02],

  // Inverted Black/White
  INVERT_ON: [0x1D, 0x42, 0x01],
  INVERT_OFF: [0x1D, 0x42, 0x00],

  // Character Size Multiplier: GS ! n
  // n = (width_multiplier - 1) * 16 + (height_multiplier - 1)
  // width/height: 1 to 8
  CHAR_SIZE: (widthMult: number, heightMult: number) => {
    const w = Math.min(8, Math.max(1, widthMult)) - 1;
    const h = Math.min(8, Math.max(1, heightMult)) - 1;
    return [0x1D, 0x21, (w << 4) | h];
  },

  // Font Selection: 0 = Font A (12x24), 1 = Font B (9x17)
  FONT: (fontIndex: 0 | 1) => [0x1B, 0x4D, fontIndex],

  // Paper Feeding
  FEED_LINES: (n: number) => [0x1B, 0x64, Math.min(255, Math.max(1, n))], // ESC d n

  // Paper Cutting
  CUT_FULL: [0x1D, 0x56, 0x00], // GS V 0
  CUT_PARTIAL: [0x1D, 0x56, 0x01], // GS V 1
  CUT_FEED_FULL: (n: number) => [0x1D, 0x56, 0x41, Math.min(255, Math.max(0, n))], // GS V 'A' n
  CUT_FEED_PARTIAL: (n: number) => [0x1D, 0x56, 0x42, Math.min(255, Math.max(0, n))], // GS V 'B' n

  // Real-time Status Request: DLE EOT n
  // n=1: Printer status, n=2: Offline cause, n=3: Error cause, n=4: Paper roll sensor
  STATUS_QUERY: (n: 1 | 2 | 3 | 4) => [0x10, 0x04, n],

  // Code Page Selection: ESC t n (0=CP437, 2=CP850, 16=WPC1252, etc.)
  CODE_PAGE: (n: number) => [0x1B, 0x74, Math.min(255, Math.max(0, n))],

  // Left Margin: GS L nL nH
  LEFT_MARGIN: (dots: number) => {
    const d = Math.max(0, dots);
    return [0x1D, 0x4C, d & 0xFF, (d >> 8) & 0xFF];
  },

  // Printable Area Width: GS W nL nH
  PRINTABLE_WIDTH: (dots: number) => {
    const d = Math.max(1, dots);
    return [0x1D, 0x57, d & 0xFF, (d >> 8) & 0xFF];
  },
} as const;
