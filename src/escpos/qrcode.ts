import { QRErrorCorrection } from '../types/escpos';
import { CMD } from './commands';

export interface QrOptions {
  model?: 1 | 2; // Model 1 or Model 2 (default 2)
  size?: number; // 1 to 16 dots per module (default 6)
  errorCorrection?: QRErrorCorrection; // 'L' (7%), 'M' (15%), 'Q' (25%), 'H' (30%)
}

export class EscPosQrCode {
  /**
   * Generates standard ESC/POS 2D QR Code command bytes
   */
  static generate(data: string, options: QrOptions = {}): number[] {
    if (!data || data.length === 0) {
      throw new Error('QR Code data cannot be empty');
    }

    const model = options.model ?? 2;
    const size = Math.min(16, Math.max(1, options.size ?? 6));
    const ec = options.errorCorrection ?? 'M';

    // Map error correction to ESC/POS byte:
    // 48 (0x30) = Level L (7%)
    // 49 (0x31) = Level M (15%)
    // 50 (0x32) = Level Q (25%)
    // 51 (0x33) = Level H (30%)
    const ecMap: Record<QRErrorCorrection, number> = {
      L: 48,
      M: 49,
      Q: 50,
      H: 51,
    };
    const ecByte = ecMap[ec] || 49;

    const encodedData = Array.from(new TextEncoder().encode(data));
    const bytes: number[] = [];

    // 1. Function 165: Select QR Model (GS ( k 4 0 49 65 n1 n2)
    // n1 = 49 (Model 1), 50 (Model 2, recommended)
    const modelByte = model === 1 ? 49 : 50;
    bytes.push(CMD.GS, 0x28, 0x6B, 0x04, 0x00, 49, 65, modelByte, 0x00);

    // 2. Function 167: Set module size (GS ( k 3 0 49 67 size)
    bytes.push(CMD.GS, 0x28, 0x6B, 0x03, 0x00, 49, 67, size);

    // 3. Function 169: Set error correction (GS ( k 3 0 49 69 ecByte)
    bytes.push(CMD.GS, 0x28, 0x6B, 0x03, 0x00, 49, 69, ecByte);

    // 4. Function 180: Store data (GS ( k pL pH 49 80 48 d1...dk)
    // Length includes the 3 parameters (49, 80, 48) + data bytes
    const storeLen = encodedData.length + 3;
    const pL = storeLen & 0xFF;
    const pH = (storeLen >> 8) & 0xFF;
    bytes.push(CMD.GS, 0x28, 0x6B, pL, pH, 49, 80, 48, ...encodedData);

    // 5. Function 181: Print the symbol (GS ( k 3 0 49 81 48)
    bytes.push(CMD.GS, 0x28, 0x6B, 0x03, 0x00, 49, 81, 48);

    return bytes;
  }
}
