import { describe, it, expect, beforeEach } from 'vitest';
import { DiagnosticTestRunner } from '../../src/diagnostics/testRunner';
import { MockPrinterTransport } from '../../src/transports/mock';
import { PrintJobQueue } from '../../src/transports/queue';
import { DEFAULT_PROFILES } from '../../src/profiles/defaultProfiles';

describe('DiagnosticTestRunner Integration', () => {
  let runner: DiagnosticTestRunner;
  let transport: MockPrinterTransport;
  let queue: PrintJobQueue;
  const profile80 = DEFAULT_PROFILES['standard-80mm'];
  const profile58 = DEFAULT_PROFILES['standard-58mm'];

  beforeEach(async () => {
    runner = new DiagnosticTestRunner();
    transport = new MockPrinterTransport({ simulateDelayMs: 10 });
    queue = new PrintJobQueue();
    queue.setTransport(transport);
  });

  it('should run Test A (Connection) successfully', async () => {
    await transport.connect();
    const result = await runner.runTest('test_a', transport, queue, profile80);
    expect(result.status).toBe('passed');
    expect(result.details).toContain('Connection active & verified');
  });

  it('should fail tests when printer is disconnected', async () => {
    const result = await runner.runTest('test_b', transport, queue, profile80);
    expect(result.status).toBe('failed');
    expect(result.details).toContain('Printer is disconnected');
  });

  it('should transition to awaiting_verification for hardware print tests', async () => {
    await transport.connect();
    const result = await runner.runTest('test_b', transport, queue, profile80);
    expect(result.status).toBe('awaiting_verification');
    expect(result.bytesTransmitted).toBeGreaterThan(0);

    // Verify operator update
    runner.updateVerification('test_b', 'passed', 'Printed cleanly');
    const updated = runner.getResults().get('test_b');
    expect(updated?.status).toBe('passed');
    expect(updated?.userVerification).toBe('passed');
    expect(updated?.userNotes).toBe('Printed cleanly');
  });

  it('should mark cutter test as unsupported when profile has no cutter', async () => {
    await transport.connect();
    // profile58 has supportsCutter: false
    const result = await runner.runTest('test_h', transport, queue, profile58);
    expect(result.status).toBe('unsupported');
    expect(result.details).toContain('not supported');
  });

  it('should run batch test runner across supported safe tests', async () => {
    await transport.connect();
    await runner.runAll(transport, queue, profile80);

    const results = runner.getResults();
    expect(results.get('test_a')?.status).toBe('passed');
    expect(results.get('test_b')?.status).toBe('awaiting_verification');
    expect(results.get('test_c')?.status).toBe('awaiting_verification');
    expect(results.get('test_d')?.status).toBe('awaiting_verification');
    expect(results.get('test_e')?.status).toBe('awaiting_verification');
    expect(results.get('test_f')?.status).toBe('awaiting_verification');
    expect(results.get('test_g')?.status).toBe('awaiting_verification');
  });

  it('should generate pre-built payloads for previewing without transmitting', () => {
    const payloadB = runner.getTestPayload('test_b', profile80, transport);
    expect(payloadB.length).toBeGreaterThan(0);

    const payloadC = runner.getTestPayload('test_c', profile80, transport);
    expect(payloadC.length).toBeGreaterThan(0);

    const payloadE = runner.getTestPayload('test_e', profile80, transport, { barcodeData: 'BARCODE-99' });
    expect(payloadE.length).toBeGreaterThan(0);

    const payloadG = runner.getTestPayload('test_g', profile80, transport, { feedLines: 8 });
    expect(payloadG.length).toBeGreaterThan(0);
  });

  it('should support configurable feed lines in Test G', async () => {
    await transport.connect();
    const result = await runner.runTest('test_g', transport, queue, profile80, { feedLines: 10 });
    expect(result.status).toBe('awaiting_verification');
    expect(result.details).toContain('10 line-feed');
  });

  it('should query printer status in Test I and report flags', async () => {
    await transport.connect();
    const result = await runner.runTest('test_i', transport, queue, profile80);
    expect(result.status).toBe('passed');
    expect(result.details).toContain('Paper OK');
  });

  it('should execute Test J stress test and require physical verification', async () => {
    await transport.connect();
    const result = await runner.runTest('test_j', transport, queue, profile80, { stressIterations: 2 });
    expect(result.status).toBe('awaiting_verification');
    expect(result.details).toContain('Completed 2/2');
    expect(result.bytesTransmitted).toBeGreaterThan(0);
  });

  it('should allow rapid re-running of tests without duplicate debounce failing the test', async () => {
    await transport.connect();
    const res1 = await runner.runTest('test_b', transport, queue, profile80);
    expect(res1.status).toBe('awaiting_verification');

    // Run again immediately
    const res2 = await runner.runTest('test_b', transport, queue, profile80);
    expect(res2.status).not.toBe('failed');
    expect(res2.status).toBe('awaiting_verification');
  });

  it('should format Test C lines so they strictly never exceed 32 columns on 58mm paper', () => {
    const payload58 = runner.generateTestCPayload(profile58);
    // Decode readable lines from binary payload
    const text = new TextDecoder().decode(payload58);
    const rawLines = text.split('\n');

    for (const rawLine of rawLines) {
      // Strip non-printable ESC/POS control bytes to check visible character count
      const printable = rawLine.replace(/[^\x20-\x7E]/g, '');
      if (printable.length > 0) {
        expect(printable.length).toBeLessThanOrEqual(32);
      }
    }
  });

  it('should format Test C lines so they strictly never exceed 48 columns on 80mm paper', () => {
    const payload80 = runner.generateTestCPayload(profile80);
    const text = new TextDecoder().decode(payload80);
    const rawLines = text.split('\n');

    for (const rawLine of rawLines) {
      const printable = rawLine.replace(/[^\x20-\x7E]/g, '');
      if (printable.length > 0) {
        expect(printable.length).toBeLessThanOrEqual(48);
      }
    }
  });

  it('should execute Test H cutter test with header and cut command when supported', async () => {
    await transport.connect();
    // profile80 supports cutter
    const result = await runner.runTest('test_h', transport, queue, profile80, { cutType: 'partial' });
    expect(result.status).toBe('awaiting_verification');
    expect(result.details).toContain('PARTIAL cut command transmitted');
    expect(result.bytesTransmitted).toBeGreaterThan(0);
  });
});
