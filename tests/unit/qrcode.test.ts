import { describe, it, expect } from 'vitest';
import { EscPosQrCode } from '../../src/escpos/qrcode';

describe('EscPosQrCode', () => {
  it('should generate standard 2D code commands', () => {
    const bytes = EscPosQrCode.generate('https://example.com', {
      model: 2,
      size: 6,
      errorCorrection: 'M',
    });

    // Check function 165 (Model 2)
    // GS ( k 4 0 49 65 50 0
    expect(bytes.slice(0, 9)).toEqual([0x1D, 0x28, 0x6B, 0x04, 0x00, 49, 65, 50, 0x00]);

    // Check function 167 (Size 6)
    // GS ( k 3 0 49 67 6
    expect(bytes.slice(9, 17)).toEqual([0x1D, 0x28, 0x6B, 0x03, 0x00, 49, 67, 6]);

    // Check function 169 (EC Level M = 49)
    // GS ( k 3 0 49 69 49
    expect(bytes.slice(17, 25)).toEqual([0x1D, 0x28, 0x6B, 0x03, 0x00, 49, 69, 49]);

    // Check print command at the end
    // GS ( k 3 0 49 81 48
    const last8 = bytes.slice(bytes.length - 8);
    expect(last8).toEqual([0x1D, 0x28, 0x6B, 0x03, 0x00, 49, 81, 48]);
  });

  it('should map error correction levels correctly', () => {
    const bytesL = EscPosQrCode.generate('TEST', { errorCorrection: 'L' });
    expect(bytesL[24]).toBe(48); // Level L = 48

    const bytesH = EscPosQrCode.generate('TEST', { errorCorrection: 'H' });
    expect(bytesH[24]).toBe(51); // Level H = 51
  });

  it('should throw error for empty data string', () => {
    expect(() => {
      EscPosQrCode.generate('');
    }).toThrow();
  });

  it('should correctly encode non-ASCII UTF-8 strings into valid byte arrays', () => {
    // E.g. URL with Unicode query or international text
    const text = 'https://example.com/pay?name=Café';
    const bytes = EscPosQrCode.generate(text);
    // Find Function 180 (Store Data: 49, 80, 48)
    const storeIdx = bytes.findIndex((b, idx) => b === 49 && bytes[idx + 1] === 80 && bytes[idx + 2] === 48);
    expect(storeIdx).toBeGreaterThan(0);
    const dataBytes = bytes.slice(storeIdx + 3, bytes.length - 8);
    // 'Café' encoded in UTF-8 has 'é' as [0xC3, 0xA9]
    const decoded = new TextDecoder().decode(new Uint8Array(dataBytes));
    expect(decoded).toBe(text);
  });
});
