import { describe, it, expect } from 'vitest';
import { BarcodeValidator, EscPosBarcode } from '../../src/escpos/barcode';

describe('BarcodeValidator & EscPosBarcode', () => {
  it('should validate CODE128 data correctly', () => {
    const valid = BarcodeValidator.validate('CODE128', 'ITEM-1234');
    expect(valid.isValid).toBe(true);
    expect(valid.normalized).toBe('ITEM-1234');

    const invalid = BarcodeValidator.validate('CODE128', '');
    expect(invalid.isValid).toBe(false);
  });

  it('should validate and normalize CODE39', () => {
    const valid = BarcodeValidator.validate('CODE39', 'abc-123');
    expect(valid.isValid).toBe(true);
    expect(valid.normalized).toBe('ABC-123'); // Normalized to uppercase

    const invalid = BarcodeValidator.validate('CODE39', 'abc#123'); // # is not in CODE39
    expect(invalid.isValid).toBe(false);
  });

  it('should validate and calculate check digit for 12-digit EAN13', () => {
    // 12 digits: 400638133393 -> checksum should be exactly 1
    const valid = BarcodeValidator.validate('EAN13', '400638133393');
    expect(valid.isValid).toBe(true);
    expect(valid.normalized).toBe('4006381333931');
  });

  it('should validate and calculate check digit for 7-digit EAN8', () => {
    // 7 digits: 7351353 -> checksum should be exactly 7
    const valid = BarcodeValidator.validate('EAN8', '7351353');
    expect(valid.isValid).toBe(true);
    expect(valid.normalized).toBe('73513537');
  });

  it('should validate and calculate check digit for 11-digit UPC-A', () => {
    // 11 digits: 01234567890 -> checksum should be exactly 5
    const valid = BarcodeValidator.validate('UPC-A', '01234567890');
    expect(valid.isValid).toBe(true);
    expect(valid.normalized).toBe('012345678905');
  });

  it('should reject invalid 13th check digit for full EAN13', () => {
    // 4006381333937 has wrong check digit (7 instead of 1)
    const invalid = BarcodeValidator.validate('EAN13', '4006381333937');
    expect(invalid.isValid).toBe(false);
    expect(invalid.error).toContain('Invalid EAN13 check digit');
  });

  it('should accept valid 13th check digit for full EAN13', () => {
    const valid = BarcodeValidator.validate('EAN13', '4006381333931');
    expect(valid.isValid).toBe(true);
    expect(valid.normalized).toBe('4006381333931');
  });

  it('should reject invalid length for EAN13', () => {
    const invalid = BarcodeValidator.validate('EAN13', '12345');
    expect(invalid.isValid).toBe(false);
  });

  it('should generate valid ESC/POS byte sequence for CODE128', () => {
    const bytes = EscPosBarcode.generate(
      { type: 'CODE128', height: 64, width: 2, hriPosition: 'below' },
      'TEST123'
    );
    // GS h 64 (0x1D, 0x68, 64)
    expect(bytes[0]).toBe(0x1D);
    expect(bytes[1]).toBe(0x68);
    expect(bytes[2]).toBe(64);

    // GS w 2 (0x1D, 0x77, 2)
    expect(bytes[3]).toBe(0x1D);
    expect(bytes[4]).toBe(0x77);
    expect(bytes[5]).toBe(2);

    // GS H 2 (HRI below)
    expect(bytes[6]).toBe(0x1D);
    expect(bytes[7]).toBe(0x48);
    expect(bytes[8]).toBe(2);

    // GS k 73 len ... (System B)
    expect(bytes[9]).toBe(0x1D);
    expect(bytes[10]).toBe(0x6B);
    expect(bytes[11]).toBe(73); // CODE128
  });

  it('should throw error when generating barcode with invalid data', () => {
    expect(() => {
      EscPosBarcode.generate({ type: 'EAN13' }, 'INVALID-CHARS');
    }).toThrow();
  });

  it('should properly escape literal curly brace characters in CODE128', () => {
    const bytes = EscPosBarcode.generate(
      { type: 'CODE128', height: 50, width: 2 },
      'A{B'
    );
    const gsKIndex = bytes.indexOf(0x6B);
    expect(gsKIndex).toBeGreaterThan(0);
    const len = bytes[gsKIndex + 2];
    const encoded = bytes.slice(gsKIndex + 3, gsKIndex + 3 + len);
    // '{', 'B', 'A', '{', '{', 'B' -> length 6
    expect(encoded).toEqual([0x7B, 0x42, 0x41, 0x7B, 0x7B, 0x42]);
  });

  it('should clamp barcode module width to 2 when printing on 58mm (384 dots) to prevent hardware drop', () => {
    const longPayload = 'RECEIPT-2026-X99';
    // When requesting width 4 on 58mm paper (maxDots: 384)
    const bytes = EscPosBarcode.generate(
      { type: 'CODE128', width: 4, maxDots: 384 },
      longPayload
    );
    // GS w byte should be clamped to 2 instead of 4
    // GS w is at index 3, 4, 5
    expect(bytes[3]).toBe(0x1D);
    expect(bytes[4]).toBe(0x77);
    expect(bytes[5]).toBe(2);
  });
});
