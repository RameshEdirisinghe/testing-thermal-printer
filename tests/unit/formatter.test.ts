import { describe, it, expect } from 'vitest';
import { TextFormatter } from '../../src/escpos/formatter';

describe('TextFormatter', () => {
  it('should sanitize non-ASCII characters with safe replacements', () => {
    const raw = 'Special—dash and “quotes” and €10';
    const sanitized = TextFormatter.sanitizeAscii(raw);
    expect(sanitized).toBe('Special-dash and "quotes" and EUR10');
  });

  it('should justify text between left and right margins', () => {
    const line32 = TextFormatter.justifyBetween('Subtotal', '$15.00', 32);
    expect(line32.length).toBe(32);
    expect(line32.startsWith('Subtotal')).toBe(true);
    expect(line32.endsWith('$15.00')).toBe(true);

    const line48 = TextFormatter.justifyBetween('Total Due', '$120.50', 48);
    expect(line48.length).toBe(48);
    expect(line48.startsWith('Total Due')).toBe(true);
    expect(line48.endsWith('$120.50')).toBe(true);
  });

  it('should format 3-column table row matching exact column width', () => {
    const row32 = TextFormatter.formatTableRow('Espresso', '2', '$7.00', 32);
    expect(row32.length).toBe(32);

    const row48 = TextFormatter.formatTableRow('Artisan Croissant', '1', '$4.50', 48);
    expect(row48.length).toBe(48);
  });

  it('should generate column ruler matching column count', () => {
    const ruler32 = TextFormatter.generateColumnRuler(32);
    expect(ruler32.markers.length).toBe(32);
    expect(ruler32.numbers.length).toBe(32);
    // 10th char should be '1', 20th char should be '2', 30th char should be '3'
    expect(ruler32.markers[9]).toBe('1');
    expect(ruler32.markers[19]).toBe('2');
    expect(ruler32.markers[29]).toBe('3');
  });

  it('should wrap long text within maximum columns', () => {
    const text = 'This is a long sentence that definitely exceeds the thermal receipt column width constraint.';
    const wrapped = TextFormatter.wrapText(text, 32);
    expect(wrapped.length).toBeGreaterThan(1);
    for (const line of wrapped) {
      expect(line.length).toBeLessThanOrEqual(32);
    }
  });

  it('should transliterate Sinhala and Indian currency symbols properly', () => {
    const sinhalaPrice = 'මිල: රු. 1500';
    const sanitized = TextFormatter.sanitizeAscii(sinhalaPrice);
    expect(sanitized).toContain('Rs. 1500');

    const inrPrice = '₹250';
    expect(TextFormatter.sanitizeAscii(inrPrice)).toBe('Rs.250');
  });

  it('should transliterate accented Latin characters cleanly', () => {
    const menu = 'Café Crème & Jalapeño';
    const sanitized = TextFormatter.sanitizeAscii(menu);
    expect(sanitized).toBe('Cafe Creme & Jalapeno');
  });

  it('should detect unsupported Sinhala and Tamil Unicode scripts', () => {
    const sinhalaText = 'ආයුබෝවන් - ස්තූතියි';
    const detection = TextFormatter.detectUnsupportedScripts(sinhalaText);
    expect(detection.hasSinhala).toBe(true);
    expect(detection.warning).toBeDefined();
    expect(detection.warning).toContain('Sinhala characters detected');

    const englishText = 'Receipt for Table 4';
    const englishDetection = TextFormatter.detectUnsupportedScripts(englishText);
    expect(englishDetection.hasSinhala).toBe(false);
    expect(englishDetection.warning).toBeUndefined();
  });

  it('should extract readable text lines from ESC/POS binary data while stripping control codes', () => {
    // ESC @ (init), ESC a 1 (center), "TEST RECEIPT", LF, ESC E 1 (bold), "Line 2", LF
    const data = new Uint8Array([
      0x1B, 0x40,
      0x1B, 0x61, 0x01,
      0x54, 0x45, 0x53, 0x54, 0x20, 0x52, 0x45, 0x43, 0x45, 0x49, 0x50, 0x54,
      0x0A,
      0x1B, 0x45, 0x01,
      0x4C, 0x69, 0x6E, 0x65, 0x20, 0x32,
      0x0A,
      0x1D, 0x56, 0x01 // partial cut
    ]);

    const extracted = TextFormatter.extractReadableLines(data);
    expect(extracted).toContain('TEST RECEIPT');
    expect(extracted).toContain('Line 2');
    expect(extracted).not.toContain('\x1B');
    expect(extracted).not.toContain('\x1D');
  });
});
