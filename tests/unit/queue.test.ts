import { describe, it, expect, beforeEach } from 'vitest';
import { PrintJobQueue } from '../../src/transports/queue';
import { MockPrinterTransport } from '../../src/transports/mock';

describe('PrintJobQueue', () => {
  let queue: PrintJobQueue;
  let mockTransport: MockPrinterTransport;

  beforeEach(async () => {
    queue = new PrintJobQueue();
    mockTransport = new MockPrinterTransport({ simulateDelayMs: 20 });
    queue.setTransport(mockTransport);
  });

  it('should reject enqueuing when transport is not connected', async () => {
    await expect(queue.enqueue('Test Job', new Uint8Array([1, 2, 3]))).rejects.toThrow(
      'Cannot queue print job: Printer is not connected.'
    );
  });

  it('should process job successfully when printer is connected', async () => {
    await mockTransport.connect();
    const data = new Uint8Array([0x1B, 0x40, 0x54, 0x45, 0x53, 0x54, 0x0A]);
    const result = await queue.enqueue('Test Print', data);

    expect(result.success).toBe(true);
    expect(result.bytesSent).toBe(data.length);
    expect(mockTransport.getCapturedBytes().length).toBe(1);
  });

  it('should process multiple jobs in sequential FIFO order', async () => {
    await mockTransport.connect();
    const job1Data = new Uint8Array([1, 1, 1]);
    const job2Data = new Uint8Array([2, 2, 2]);

    const p1 = queue.enqueue('Job 1', job1Data);
    const p2 = queue.enqueue('Job 2', job2Data);

    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    const captured = mockTransport.getCapturedBytes();
    expect(captured.length).toBe(2);
    expect(Array.from(captured[0])).toEqual([1, 1, 1]);
    expect(Array.from(captured[1])).toEqual([2, 2, 2]);
  });

  it('should abort queue and notify failure on transport disconnect', async () => {
    await mockTransport.connect();
    mockTransport.setFailNextSend(true);

    await expect(queue.enqueue('Failing Job', new Uint8Array([1, 2, 3]))).rejects.toThrow();
  });

  it('should prevent accidental duplicate print job submissions', async () => {
    await mockTransport.connect();
    const data = new Uint8Array([5, 6, 7]);

    const p1 = queue.enqueue('Dupe Test', data);
    // Submit identical job immediately
    await expect(queue.enqueue('Dupe Test', data)).rejects.toThrow(
      'Duplicate print job prevented'
    );

    const res1 = await p1;
    expect(res1.success).toBe(true);
  });

  it('should support cancelling queued jobs and clearing queue', async () => {
    await mockTransport.connect();
    // Simulate slower processing
    const slowTransport = new MockPrinterTransport({ simulateDelayMs: 200 });
    queue.setTransport(slowTransport);
    await slowTransport.connect();

    // Start a first job
    const p1 = queue.enqueue('Job 1', new Uint8Array([1, 2, 3]));
    // Enqueue second job that waits in pending queue
    const p2 = queue.enqueue('Job 2', new Uint8Array([4, 5, 6]));

    const pendingJobs = queue.getQueue();
    expect(pendingJobs.length).toBeGreaterThanOrEqual(1);

    const cancelled = queue.cancelJob(pendingJobs[0].id);
    expect(cancelled).toBe(true);
    await expect(p2).rejects.toThrow('Print job cancelled by user');

    await p1;
  });
});
