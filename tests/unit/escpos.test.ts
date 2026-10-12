import { describe, it, expect } from 'vitest';
import { EscPosBuilder } from '../../src/escpos/builder';
import { CMD } from '../../src/escpos/commands';

describe('EscPosBuilder', () => {
  it('should initialize printer with ESC @', () => {
    const builder = new EscPosBuilder().init();
    const bytes = builder.build();
    expect(Array.from(bytes)).toEqual([...CMD.INIT]);
  });

  it('should set alignments correctly', () => {
    const leftBytes = new EscPosBuilder().align('left').build();
    expect(Array.from(leftBytes)).toEqual([0x1B, 0x61, 0x00]);

    const centerBytes = new EscPosBuilder().align('center').build();
    expect(Array.from(centerBytes)).toEqual([0x1B, 0x61, 0x01]);

    const rightBytes = new EscPosBuilder().align('right').build();
    expect(Array.from(rightBytes)).toEqual([0x1B, 0x61, 0x02]);
  });

  it('should toggle bold emphasis', () => {
    const boldOn = new EscPosBuilder().bold(true).build();
    expect(Array.from(boldOn)).toEqual([...CMD.EMPHASIS_ON]);

    const boldOff = new EscPosBuilder().bold(false).build();
    expect(Array.from(boldOff)).toEqual([...CMD.EMPHASIS_OFF]);
  });

  it('should toggle underline', () => {
    const u1 = new EscPosBuilder().underline(1).build();
    expect(Array.from(u1)).toEqual([...CMD.UNDERLINE_1DOT]);

    const u0 = new EscPosBuilder().underline(0).build();
    expect(Array.from(u0)).toEqual([...CMD.UNDERLINE_OFF]);
  });

  it('should set character size multipliers', () => {
    // 2x width, 2x height: (1 << 4) | 1 = 0x11
    const size2x2 = new EscPosBuilder().size(2, 2).build();
    expect(Array.from(size2x2)).toEqual([0x1D, 0x21, 0x11]);

    // 1x width, 1x height: 0x00
    const size1x1 = new EscPosBuilder().size(1, 1).build();
    expect(Array.from(size1x1)).toEqual([0x1D, 0x21, 0x00]);
  });

  it('should append text and line feed', () => {
    const bytes = new EscPosBuilder().line('TEST').build();
    expect(Array.from(bytes)).toEqual([0x54, 0x45, 0x53, 0x54, 0x0A]);
  });

  it('should issue cut command with feed', () => {
    const bytes = new EscPosBuilder().cut('partial', 3).build();
    // Feed 3 lines (0x1B, 0x64, 3) followed by partial cut (0x1D, 0x56, 1)
    expect(Array.from(bytes)).toEqual([0x1B, 0x64, 0x03, 0x1D, 0x56, 0x01]);
  });

  it('should generate real-time status query command', () => {
    const bytes = new EscPosBuilder().statusQuery(1).build();
    expect(Array.from(bytes)).toEqual([0x10, 0x04, 0x01]);
  });

  it('should set line spacing, code page, left margin, and printable width', () => {
    const bytes = new EscPosBuilder()
      .lineSpacing(30)
      .codePage(0)
      .leftMargin(16)
      .printableWidth(384)
      .build();

    expect(Array.from(bytes)).toEqual([
      0x1B, 0x33, 30, // ESC 3 30
      0x1B, 0x74, 0,  // ESC t 0
      0x1D, 0x4C, 16, 0, // GS L 16 0
      0x1D, 0x57, 128, 1 // GS W 384 (0x0180 -> 128, 1)
    ]);
  });
});
