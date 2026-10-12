export class TextFormatter {
  /**
   * Sanitizes a string to pure printable ASCII (32-126) + newline,
   * replacing unsupported characters with close equivalents or transliterated forms
   */
  static sanitizeAscii(text: string): string {
    // 1. Multi-character symbol and regional currency replacements
    let processed = text
      .replace(/රු\./g, 'Rs.')
      .replace(/රු/g, 'Rs.')
      .replace(/₹/g, 'Rs.')
      .replace(/—/g, '-')
      .replace(/–/g, '-')
      .replace(/“/g, '"')
      .replace(/”/g, '"')
      .replace(/‘/g, "'")
      .replace(/’/g, "'")
      .replace(/•/g, '*')
      .replace(/…/g, '...')
      .replace(/©/g, '(C)')
      .replace(/®/g, '(R)')
      .replace(/™/g, '(TM)')
      .replace(/€/g, 'EUR')
      .replace(/£/g, 'GBP')
      .replace(/¥/g, 'JPY')
      .replace(/°/g, ' deg')
      .replace(/№/g, 'No.')
      .replace(/×/g, 'x')
      .replace(/÷/g, '/');

    // 2. Transliterate common accented Latin characters
    const accentMap: Record<string, string> = {
      'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
      'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'Ã': 'A', 'Å': 'A',
      'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
      'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E',
      'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
      'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I',
      'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
      'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Õ': 'O',
      'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
      'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U',
      'ñ': 'n', 'Ñ': 'N', 'ç': 'c', 'Ç': 'C', 'ß': 'ss',
    };

    processed = processed.replace(/[^\x20-\x7E\n]/g, char => {
      return accentMap[char] ?? '?';
    });

    return processed;
  }

  /**
   * Detects non-ASCII scripts (such as Sinhala, Tamil, Arabic, etc.) that cannot be printed
   * with built-in ESC/POS ASCII/CP437 fonts.
   */
  static detectUnsupportedScripts(text: string): { hasSinhala: boolean; hasTamil: boolean; hasOtherUnicode: boolean; warning?: string } {
    const hasSinhala = /[\u0D80-\u0DFF]/.test(text);
    const hasTamil = /[\u0B80-\u0BFF]/.test(text);
    const hasOtherUnicode = /[^\x00-\x7F\u0D80-\u0DFF\u0B80-\u0BFF]/.test(text);

    if (hasSinhala || hasTamil) {
      const script = hasSinhala ? 'Sinhala' : 'Tamil';
      return {
        hasSinhala,
        hasTamil,
        hasOtherUnicode,
        warning: `Notice: ${script} characters detected. Standard ESC/POS thermal printers do not have built-in ROM fonts for ${script} script. Characters will be replaced or appear as '?' in direct ESC/POS mode. For proper ${script} rendering, use the 'Browser Print' fallback which prints via OS fonts.`
      };
    }

    return { hasSinhala: false, hasTamil: false, hasOtherUnicode };
  }

  /**
   * Formats a left-aligned text and right-aligned text within the given column width.
   * e.g. "Subtotal" and "$12.00" on a 32-column receipt
   */
  static justifyBetween(left: string, right: string, totalColumns: number): string {
    const l = left.trim();
    const r = right.trim();
    const spacesNeeded = totalColumns - (l.length + r.length);

    if (spacesNeeded >= 1) {
      return l + ' '.repeat(spacesNeeded) + r;
    }

    // If text exceeds column width, truncate or wrap left
    if (l.length + 1 + r.length > totalColumns) {
      const maxLeft = Math.max(1, totalColumns - r.length - 1);
      const truncatedLeft = l.substring(0, maxLeft);
      return truncatedLeft + ' ' + r;
    }

    return l + ' ' + r;
  }

  /**
   * Formats a 3-column table line: Item (left), Qty (center/short), Amount (right)
   * e.g. for 32 columns: Item(18) Qty(4) Amount(10)
   * for 48 columns: Item(28) Qty(6) Amount(14)
   */
  static formatTableRow(
    col1: string,
    col2: string,
    col3: string,
    totalColumns: number
  ): string {
    // Proportional column allocations
    const col2Width = totalColumns <= 32 ? 4 : 6;
    const col3Width = totalColumns <= 32 ? 9 : 12;
    const col1Width = totalColumns - col2Width - col3Width;

    const c1 = col1.padEnd(col1Width).substring(0, col1Width);
    const c2 = col2.padStart(col2Width).substring(0, col2Width);
    const c3 = col3.padStart(col3Width).substring(0, col3Width);

    return `${c1}${c2}${c3}`;
  }

  /**
   * Generates a horizontal separator line of specified column length
   */
  static horizontalRule(char = '-', columns: number): string {
    return char.repeat(Math.max(1, columns));
  }

  /**
   * Generates a diagnostic column ruler showing exact column numbers
   * e.g. for 32 columns:
   * Line 1: ....+....1....+....2....+....3..
   * Line 2: 12345678901234567890123456789012
   */
  static generateColumnRuler(columns: number): { markers: string; numbers: string } {
    let markers = '';
    let numbers = '';

    for (let i = 1; i <= columns; i++) {
      if (i % 10 === 0) {
        markers += Math.floor(i / 10).toString();
      } else if (i % 5 === 0) {
        markers += '+';
      } else {
        markers += '.';
      }

      numbers += (i % 10).toString();
    }

    return { markers, numbers };
  }

  /**
   * Wraps text cleanly at word boundaries to fit within maxColumns
   */
  static wrapText(text: string, maxColumns: number): string[] {
    const lines: string[] = [];
    const rawParagraphs = text.split('\n');

    for (const paragraph of rawParagraphs) {
      if (paragraph.length === 0) {
        lines.push('');
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        if (word.length > maxColumns) {
          // Hard split if a single word is longer than the entire line
          if (currentLine) {
            lines.push(currentLine);
            currentLine = '';
          }
          let remaining = word;
          while (remaining.length > maxColumns) {
            lines.push(remaining.substring(0, maxColumns));
            remaining = remaining.substring(maxColumns);
          }
          currentLine = remaining;
          continue;
        }

        if (currentLine.length === 0) {
          currentLine = word;
        } else if (currentLine.length + 1 + word.length <= maxColumns) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  /**
   * Extracts clean, readable text lines from an ESC/POS binary byte buffer,
   * stripping control codes and keeping printable text and newlines.
   * Useful for browser print fallback rendering of diagnostic test payloads.
   */
  static extractReadableLines(data: Uint8Array): string {
    const chars: string[] = [];
    const len = data.length;
    let i = 0;

    while (i < len) {
      const b = data[i];

      // Line Feed
      if (b === 0x0A) {
        chars.push('\n');
        i++;
        continue;
      }

      // Skip ESC commands
      if (b === 0x1B) {
        i++;
        if (i < len) {
          const cmd = data[i];
          if (cmd === 0x40 || cmd === 0x32) { // ESC @, ESC 2
            i++;
          } else if (cmd === 0x61 || cmd === 0x45 || cmd === 0x2D || cmd === 0x64 || cmd === 0x33 || cmd === 0x74 || cmd === 0x4D) {
            i += 2; // 1-param commands
          } else {
            i++;
          }
        }
        continue;
      }

      // Skip GS commands
      if (b === 0x1D) {
        i++;
        if (i < len) {
          const cmd = data[i];
          if (cmd === 0x21 || cmd === 0x42 || cmd === 0x68 || cmd === 0x77 || cmd === 0x48 || cmd === 0x66) {
            i += 2; // 1-param commands
          } else if (cmd === 0x56) { // GS V cut
            i++;
            if (i < len) {
              const m = data[i];
              if (m === 0x41 || m === 0x42) i += 2;
              else i++;
            }
          } else if (cmd === 0x4C || cmd === 0x57) { // 2-byte commands
            i += 3;
          } else if (cmd === 0x6B) { // barcode: GS k m n d1..dn
            i++;
            if (i < len) {
              i++; // m
              if (i < len) {
                const n = data[i];
                i += 1 + n; // skip data
              }
            }
          } else if (cmd === 0x28) { // GS ( k QR code
            i += 2; // 'k'
            if (i + 1 < len) {
              const pL = data[i];
              const pH = data[i + 1];
              const pLen = pL | (pH << 8);
              i += 2 + pLen;
            }
          } else {
            i++;
          }
        }
        continue;
      }

      // Skip DLE commands (DLE EOT n)
      if (b === 0x10) {
        i += 3;
        continue;
      }

      // Printable ASCII or newline
      if (b >= 32 && b <= 126) {
        chars.push(String.fromCharCode(b));
      }

      i++;
    }

    return chars.join('').replace(/\n{3,}/g, '\n\n').trim();
  }
}
