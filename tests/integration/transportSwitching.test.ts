import { describe, it, expect, vi } from 'vitest';
import { MockPrinterTransport } from '../../src/transports/mock';
import { BrowserPrintTransport } from '../../src/transports/browser';
import { PrintJobQueue } from '../../src/transports/queue';

describe('Transport Switching and Fallback Integration', () => {
  it('should switch transports cleanly and update queue target', async () => {
    const queue = new PrintJobQueue();

    const mockTransport = new MockPrinterTransport({ simulateDelayMs: 10 });
    queue.setTransport(mockTransport);
    await mockTransport.connect();
    expect(mockTransport.status).toBe('connected');

    // Print to mock transport
    const res1 = await queue.enqueue('Test 1', new Uint8Array([0x1B, 0x40, 0x0A]));
    expect(res1.success).toBe(true);
    expect(mockTransport.getCapturedBytes().length).toBe(1);

    // Switch to browser print transport
    await mockTransport.disconnect();
    expect(mockTransport.status).toBe('disconnected');

    const browserTransport = new BrowserPrintTransport();
    queue.setTransport(browserTransport);
    await browserTransport.connect();
    expect(browserTransport.status).toBe('connected');

    // Mock window.print
    const printSpy = vi.fn();
    (globalThis as any).window = { print: printSpy };

    let emittedPrintText: string | null = null;
    const unsub = BrowserPrintTransport.onPrintPayload((text) => {
      emittedPrintText = text;
    });

    const res2 = await queue.enqueue('Test 2', new Uint8Array([0x1B, 0x40, 0x41, 0x42, 0x43, 0x0A]));
    expect(res2.success).toBe(true);
    expect(printSpy).toHaveBeenCalled();
    expect(emittedPrintText).toBeNull(); // Reset after print completed

    unsub();
    await browserTransport.disconnect();
    expect(browserTransport.status).toBe('disconnected');
  });

  it('should not throw unhandled rejection when transport disconnects with pending queue', async () => {
    const queue = new PrintJobQueue();
    const mockTransport = new MockPrinterTransport({ simulateDelayMs: 200 });
    queue.setTransport(mockTransport);
    await mockTransport.connect();

    // Start long send
    const sendPromise = queue.enqueue('In flight', new Uint8Array([0x0A, 0x0A, 0x0A]));

    // Unexpected disconnect
    mockTransport.simulateUnexpectedDisconnect();

    await expect(sendPromise).rejects.toThrow();
    expect(queue.getActiveJob()).toBeNull();
    expect(queue.getQueue().length).toBe(0);
  });
});
