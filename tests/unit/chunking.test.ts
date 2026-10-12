import { describe, it, expect } from 'vitest';

describe('Transport Chunking Logic', () => {
  function splitIntoChunks(data: Uint8Array, chunkSize: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    let offset = 0;
    while (offset < data.length) {
      const end = Math.min(offset + chunkSize, data.length);
      chunks.push(data.slice(offset, end));
      offset = end;
    }
    return chunks;
  }

  it('should accurately partition a 250-byte payload into 64-byte chunks', () => {
    const payload = new Uint8Array(250);
    for (let i = 0; i < 250; i++) payload[i] = i % 256;

    const chunks = splitIntoChunks(payload, 64);
    expect(chunks.length).toBe(4);
    expect(chunks[0].length).toBe(64);
    expect(chunks[1].length).toBe(64);
    expect(chunks[2].length).toBe(64);
    expect(chunks[3].length).toBe(58); // 250 - 192 = 58

    // Reassembly check
    const reassembled = new Uint8Array(250);
    let offset = 0;
    for (const c of chunks) {
      reassembled.set(c, offset);
      offset += c.length;
    }
    expect(reassembled).toEqual(payload);
  });

  it('should handle small payloads without creating extra chunks', () => {
    const payload = new Uint8Array(15);
    const chunks = splitIntoChunks(payload, 64);
    expect(chunks.length).toBe(1);
    expect(chunks[0].length).toBe(15);
  });

  it('should handle exact multiples of chunkSize', () => {
    const payload = new Uint8Array(128);
    const chunks = splitIntoChunks(payload, 64);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(64);
    expect(chunks[1].length).toBe(64);
  });
});
