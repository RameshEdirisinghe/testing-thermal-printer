import { BarcodeType, HriPosition } from '../types/escpos';
import { CMD } from './commands';

export interface BarcodeOptions {
  type: BarcodeType;
  height?: number; // 1 to 255 dots, default ~64-80
  width?: number; // 2 to 6 dot module width, default 2 or 3
  hriPosition?: HriPosition;
  hriFont?: 0 | 1;
  maxDots?: number; // Maximum printable dots on paper (e.g. 384 for 58mm, 576 for 80mm)
}

export class BarcodeValidator {
  static validate(type: BarcodeType, data: string): { isValid: boolean; normalized: string; error?: string } {
    if (!data || data.trim().length === 0) {
      return { isValid: false, normalized: '', error: 'Barcode data cannot be empty' };
    }

    const trimmed = data.trim();

    switch (type) {
      case 'CODE128': {
        // Standard printable ASCII 32 to 126
        const valid = /^[\x20-\x7E]+$/.test(trimmed);
        if (!valid) {
          return { isValid: false, normalized: trimmed, error: 'CODE128 requires printable ASCII characters' };
        }
        return { isValid: true, normalized: trimmed };
      }

      case 'CODE39': {
        // Digits, uppercase letters, and - . $ / + % space *
        const upper = trimmed.toUpperCase();
        const valid = /^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(upper);
        if (!valid) {
          return { isValid: false, normalized: upper, error: 'CODE39 requires digits, uppercase letters, or - . $ / + % space' };
        }
        return { isValid: true, normalized: upper };
      }

      case 'EAN13': {
        if (!/^\d{12,13}$/.test(trimmed)) {
          return { isValid: false, normalized: trimmed, error: 'EAN13 requires 12 or 13 digits' };
        }
        let digits = trimmed;
        if (digits.length === 12) {
          digits += BarcodeValidator.calculateEanCheckDigit(digits);
        } else {
          const expected = BarcodeValidator.calculateEanCheckDigit(digits.slice(0, 12));
          if (parseInt(digits[12], 10) !== expected) {
            return {
              isValid: false,
              normalized: digits,
              error: `Invalid EAN13 check digit: expected ${expected}, got ${digits[12]}`
            };
          }
        }
        return { isValid: true, normalized: digits };
      }

      case 'EAN8': {
        if (!/^\d{7,8}$/.test(trimmed)) {
          return { isValid: false, normalized: trimmed, error: 'EAN8 requires 7 or 8 digits' };
        }
        let digits = trimmed;
        if (digits.length === 7) {
          digits += BarcodeValidator.calculateEanCheckDigit(digits);
        } else {
          const expected = BarcodeValidator.calculateEanCheckDigit(digits.slice(0, 7));
          if (parseInt(digits[7], 10) !== expected) {
            return {
              isValid: false,
              normalized: digits,
              error: `Invalid EAN8 check digit: expected ${expected}, got ${digits[7]}`
            };
          }
        }
        return { isValid: true, normalized: digits };
      }

      case 'UPC-A': {
        if (!/^\d{11,12}$/.test(trimmed)) {
          return { isValid: false, normalized: trimmed, error: 'UPC-A requires 11 or 12 digits' };
        }
        let digits = trimmed;
        if (digits.length === 11) {
          digits += BarcodeValidator.calculateEanCheckDigit(digits);
        } else {
          const expected = BarcodeValidator.calculateEanCheckDigit(digits.slice(0, 11));
          if (parseInt(digits[11], 10) !== expected) {
            return {
              isValid: false,
              normalized: digits,
              error: `Invalid UPC-A check digit: expected ${expected}, got ${digits[11]}`
            };
          }
        }
        return { isValid: true, normalized: digits };
      }

      case 'UPC-E': {
        if (!/^\d{6,8}$/.test(trimmed)) {
          return { isValid: false, normalized: trimmed, error: 'UPC-E requires 6 to 8 digits' };
        }
        return { isValid: true, normalized: trimmed };
      }

      case 'ITF': {
        if (!/^\d+$/.test(trimmed)) {
          return { isValid: false, normalized: trimmed, error: 'ITF requires numeric digits only' };
        }
        let digits = trimmed;
        if (digits.length % 2 !== 0) {
          // Prepend zero for even length if required
          digits = '0' + digits;
        }
        return { isValid: true, normalized: digits };
      }

      default:
        return { isValid: true, normalized: trimmed };
    }
  }

  /**
   * Calculates the standard Modulo 10 check digit for GS1 barcodes (EAN-13, EAN-8, UPC-A).
   * Counting from the position immediately preceding the check digit (right to left):
   * the rightmost data digit has weight 3, the next has weight 1, alternating.
   */
  static calculateEanCheckDigit(digits: string): number {
    let sum = 0;
    const len = digits.length;
    for (let i = 0; i < len; i++) {
      const num = parseInt(digits[i], 10);
      const distanceFromRight = len - 1 - i;
      const weight = (distanceFromRight % 2 === 0) ? 3 : 1;
      sum += num * weight;
    }
    const rem = sum % 10;
    return rem === 0 ? 0 : 10 - rem;
  }
}

export class EscPosBarcode {
  /**
   * Generates ESC/POS byte sequence for barcode configuration and print
   */
  static generate(options: BarcodeOptions, data: string): number[] {
    const validation = BarcodeValidator.validate(options.type, data);
    if (!validation.isValid) {
      throw new Error(`Invalid barcode data for ${options.type}: ${validation.error}`);
    }

    const payload = validation.normalized;
    const bytes: number[] = [];

    // Set height: GS h n (1 to 255)
    const height = Math.min(255, Math.max(1, options.height ?? 64));
    bytes.push(CMD.GS, 0x68, height);

    // Set width: GS w n (2 to 6)
    // On 58mm rolls (384 dots) or long data, clamp to 2 dots/module to prevent printer clipping/dropping
    let requestedWidth = options.width ?? (options.maxDots && options.maxDots <= 384 ? 2 : 3);
    if (options.maxDots && options.maxDots <= 384 && requestedWidth > 2 && payload.length > 8) {
      requestedWidth = 2;
    }
    const width = Math.min(6, Math.max(2, requestedWidth));
    bytes.push(CMD.GS, 0x77, width);

    // Set HRI position: GS H n (0=none, 1=above, 2=below, 3=both)
    let hriCode = 2; // default below
    if (options.hriPosition === 'none') hriCode = 0;
    else if (options.hriPosition === 'above') hriCode = 1;
    else if (options.hriPosition === 'below') hriCode = 2;
    else if (options.hriPosition === 'both') hriCode = 3;
    bytes.push(CMD.GS, 0x48, hriCode);

    // Set HRI font: GS f n (0=Font A, 1=Font B)
    if (options.hriFont !== undefined) {
      bytes.push(CMD.GS, 0x66, options.hriFont);
    }

    // Generate GS k m n d1...dn (ESC/POS System B)
    let m = 73; // CODE128
    let encodedData: number[] = [];

    switch (options.type) {
      case 'UPC-A':
        m = 65;
        encodedData = Array.from(payload).map(c => c.charCodeAt(0));
        break;
      case 'UPC-E':
        m = 66;
        encodedData = Array.from(payload).map(c => c.charCodeAt(0));
        break;
      case 'EAN13':
        m = 67;
        encodedData = Array.from(payload).map(c => c.charCodeAt(0));
        break;
      case 'EAN8':
        m = 68;
        encodedData = Array.from(payload).map(c => c.charCodeAt(0));
        break;
      case 'CODE39':
        m = 69;
        encodedData = Array.from(payload).map(c => c.charCodeAt(0));
        break;
      case 'ITF':
        m = 70;
        encodedData = Array.from(payload).map(c => c.charCodeAt(0));
        break;
      case 'CODE128':
      default: {
        m = 73;
        // In ESC/POS CODE128 System B:
        // '{B' selects Code Set B for standard ASCII characters
        // Any literal '{' character in payload must be escaped as '{{'
        const chars: number[] = [0x7B, 0x42]; // '{' 'B'
        for (let i = 0; i < payload.length; i++) {
          const code = payload.charCodeAt(i);
          chars.push(code);
          if (code === 0x7B) {
            chars.push(0x7B); // escape literal '{'
          }
        }
        encodedData = chars;
        break;
      }
    }

    // GS k m n d1...dn
    bytes.push(CMD.GS, 0x6B, m, encodedData.length, ...encodedData);

    return bytes;
  }
}
