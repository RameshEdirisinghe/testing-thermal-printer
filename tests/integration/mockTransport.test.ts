import { describe, it, expect } from 'vitest';
import { MockPrinterTransport } from '../../src/transports/mock';

describe('MockPrinterTransport Integration', () => {
  it('should transition states through connect, send, and disconnect', async () => {
    const transport = new MockPrinterTransport({ simulateDelayMs: 20 });
    const states: string[] = [];

    transport.onStateChange((status) => {
      states.push(status);
    });

    expect(transport.status).toBe('disconnected');

    const dev = await transport.connect();
    expect(dev.transport).toBe('mock');
    expect(transport.status).toBe('connected');

    const progressReports: number[] = [];
    const payload = new Uint8Array([0x1B, 0x40, 0x54, 0x45, 0x53, 0x54, 0x0A]);
    const res = await transport.send(payload, (sent, total) => {
      progressReports.push(Math.round((sent / total) * 100));
    });

    expect(res.success).toBe(true);
    expect(res.bytesSent).toBe(payload.length);
    expect(progressReports.length).toBeGreaterThan(0);
    expect(progressReports[progressReports.length - 1]).toBe(100);

    const statusFlags = await transport.queryStatus();
    expect(statusFlags.supported).toBe(true);
    expect(statusFlags.paperOut).toBe(false);

    await transport.disconnect();
    expect(transport.status).toBe('disconnected');
    expect(states).toContain('connecting');
    expect(states).toContain('connected');
    expect(states).toContain('disconnecting');
    expect(states).toContain('disconnected');
  });

  it('should simulate paper out sensor status', async () => {
    const transport = new MockPrinterTransport({ paperOut: true });
    await transport.connect();

    const statusFlags = await transport.queryStatus();
    expect(statusFlags.supported).toBe(true);
    expect(statusFlags.paperOut).toBe(true);
    expect(statusFlags.offline).toBe(true);
  });
});
