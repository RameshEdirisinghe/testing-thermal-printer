import { Alignment, CutType } from '../types/escpos';
import { CMD } from './commands';
import { EscPosBarcode, BarcodeOptions } from './barcode';
import { EscPosQrCode, QrOptions } from './qrcode';
import { TextFormatter } from './formatter';

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.buffer = [];
  }

  /**
   * Initializes printer hardware (ESC @)
   */
  init(): this {
    this.buffer.push(...CMD.INIT);
    return this;
  }

  /**
   * Sets line spacing (ESC 3 n or ESC 2 for default)
   */
  lineSpacing(dots?: number): this {
    if (dots === undefined) {
      this.buffer.push(...CMD.LINE_SPACING_DEFAULT);
    } else {
      this.buffer.push(...CMD.LINE_SPACING_SET(dots));
    }
    return this;
  }

  /**
   * Sets character code page (ESC t n)
   */
  codePage(pageNumber = 0): this {
    this.buffer.push(...CMD.CODE_PAGE(pageNumber));
    return this;
  }

  /**
   * Sets physical left margin in dots (GS L nL nH)
   */
  leftMargin(dots: number): this {
    this.buffer.push(...CMD.LEFT_MARGIN(dots));
    return this;
  }

  /**
   * Sets printable area width in dots (GS W nL nH)
   */
  printableWidth(dots: number): this {
    this.buffer.push(...CMD.PRINTABLE_WIDTH(dots));
    return this;
  }

  /**
   * Sets text alignment (left, center, right)
   */
  align(alignment: Alignment): this {
    const code = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(...CMD.ALIGN(code));
    return this;
  }

  /**
   * Toggles bold / emphasis
   */
  bold(enable = true): this {
    this.buffer.push(...(enable ? CMD.EMPHASIS_ON : CMD.EMPHASIS_OFF));
    return this;
  }

  /**
   * Sets underline style (0 = off, 1 = 1-dot, 2 = 2-dot)
   */
  underline(dots: 0 | 1 | 2 = 1): this {
    if (dots === 0) {
      this.buffer.push(...CMD.UNDERLINE_OFF);
    } else if (dots === 1) {
      this.buffer.push(...CMD.UNDERLINE_1DOT);
    } else {
      this.buffer.push(...CMD.UNDERLINE_2DOT);
    }
    return this;
  }

  /**
   * Toggles inverted white-on-black text
   */
  invert(enable = true): this {
    this.buffer.push(...(enable ? CMD.INVERT_ON : CMD.INVERT_OFF));
    return this;
  }

  /**
   * Sets font character size multiplier (1-8 for width and height)
   */
  size(widthMultiplier = 1, heightMultiplier = 1): this {
    this.buffer.push(...CMD.CHAR_SIZE(widthMultiplier, heightMultiplier));
    return this;
  }

  /**
   * Selects Font A (standard 12x24) or Font B (compact 9x17)
   */
  font(font: 'A' | 'B'): this {
    this.buffer.push(...CMD.FONT(font === 'B' ? 1 : 0));
    return this;
  }

  /**
   * Writes raw string text (without trailing newline)
   */
  text(str: string): this {
    const clean = TextFormatter.sanitizeAscii(str);
    for (let i = 0; i < clean.length; i++) {
      this.buffer.push(clean.charCodeAt(i));
    }
    return this;
  }

  /**
   * Writes text followed by a Line Feed (LF)
   */
  line(str = ''): this {
    if (str.length > 0) {
      this.text(str);
    }
    this.buffer.push(CMD.LF);
    return this;
  }

  /**
   * Injects raw bytes
   */
  rawBytes(bytes: number[] | Uint8Array): this {
    if (bytes instanceof Uint8Array) {
      this.buffer.push(...Array.from(bytes));
    } else {
      this.buffer.push(...bytes);
    }
    return this;
  }

  /**
   * Prints a horizontal separator rule
   */
  rule(columns: number, char = '-'): this {
    return this.line(TextFormatter.horizontalRule(char, columns));
  }

  /**
   * Formats and prints a 2-column justified line
   */
  justify(left: string, right: string, columns: number): this {
    return this.line(TextFormatter.justifyBetween(left, right, columns));
  }

  /**
   * Formats and prints a 3-column table row
   */
  tableRow(col1: string, col2: string, col3: string, columns: number): this {
    return this.line(TextFormatter.formatTableRow(col1, col2, col3, columns));
  }

  /**
   * Encodes and appends a 1D Barcode
   */
  barcode(data: string, options: BarcodeOptions): this {
    const bytes = EscPosBarcode.generate(options, data);
    this.buffer.push(...bytes);
    return this;
  }

  /**
   * Encodes and appends a 2D QR Code
   */
  qrcode(data: string, options?: QrOptions): this {
    const bytes = EscPosQrCode.generate(data, options);
    this.buffer.push(...bytes);
    return this;
  }

  /**
   * Feeds paper by n lines
   */
  feed(lines = 1): this {
    const count = Math.min(255, Math.max(1, lines));
    this.buffer.push(...CMD.FEED_LINES(count));
    return this;
  }

  /**
   * Sends cut command after feeding lines
   */
  cut(cutType: CutType = 'partial', feedLines = 3): this {
    if (feedLines > 0) {
      this.feed(feedLines);
    }
    if (cutType === 'full') {
      this.buffer.push(...CMD.CUT_FULL);
    } else {
      this.buffer.push(...CMD.CUT_PARTIAL);
    }
    return this;
  }

  /**
   * Sends real-time status query (DLE EOT n)
   */
  statusQuery(n: 1 | 2 | 3 | 4 = 1): this {
    this.buffer.push(...CMD.STATUS_QUERY(n));
    return this;
  }

  /**
   * Builds the final Uint8Array
   */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Returns length in bytes
   */
  get length(): number {
    return this.buffer.length;
  }
}
