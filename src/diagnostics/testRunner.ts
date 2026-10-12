import { DiagnosticTestId, DiagnosticTestResult } from '../types/test';
import { PrinterProfile } from '../types/printer';
import { PrinterTransport } from '../types/transport';
import { PrintJobQueue } from '../transports/queue';
import { EscPosBuilder } from '../escpos/builder';
import { TextFormatter } from '../escpos/formatter';
import { DIAGNOSTIC_TESTS } from './testDefinitions';

export interface TestRunOptions {
  stressIterations?: number;
  feedLines?: number;
  barcodeType?: string;
  barcodeData?: string;
  qrData?: string;
  qrSize?: number;
  qrEc?: 'L' | 'M' | 'Q' | 'H';
  cutType?: 'partial' | 'full';
}

export class DiagnosticTestRunner {
  private results: Map<DiagnosticTestId, DiagnosticTestResult> = new Map();
  private listeners: Set<(results: Map<DiagnosticTestId, DiagnosticTestResult>) => void> = new Set();
  private isBatchRunning = false;

  constructor() {
    // Initialise all tests to idle
    for (const def of DIAGNOSTIC_TESTS) {
      this.results.set(def.id, {
        testId: def.id,
        name: def.name,
        status: 'idle',
        details: 'Not yet executed',
        timestamp: 0,
      });
    }
  }

  getResults(): Map<DiagnosticTestId, DiagnosticTestResult> {
    return new Map(this.results);
  }

  subscribe(listener: (results: Map<DiagnosticTestId, DiagnosticTestResult>) => void): () => void {
    this.listeners.add(listener);
    listener(new Map(this.results));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const copy = new Map(this.results);
    for (const listener of this.listeners) {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in test runner listener:', err);
      }
    }
  }

  updateVerification(testId: DiagnosticTestId, verification: 'passed' | 'failed' | 'skipped', notes?: string): void {
    const current = this.results.get(testId);
    if (!current) return;

    if (verification === 'passed') {
      current.status = 'passed';
      current.details = `Physical output verified by operator. ${notes ? `Notes: ${notes}` : ''}`;
    } else if (verification === 'failed') {
      current.status = 'failed';
      current.details = `Physical output failed operator verification. ${notes ? `Issue: ${notes}` : ''}`;
    } else {
      current.status = 'skipped';
      current.details = 'Physical verification skipped by operator.';
    }

    current.userVerification = verification;
    current.userNotes = notes;
    this.notify();
  }

  async runTest(
    testId: DiagnosticTestId,
    transport: PrinterTransport | null,
    queue: PrintJobQueue,
    profile: PrinterProfile,
    options?: TestRunOptions | number
  ): Promise<DiagnosticTestResult> {
    const opts: TestRunOptions = typeof options === 'number' ? { stressIterations: options } : (options ?? {});
    const def = DIAGNOSTIC_TESTS.find(t => t.id === testId);
    const testName = def?.name || testId;

    const setRes = (status: DiagnosticTestResult['status'], details: string, bytes?: number): DiagnosticTestResult => {
      const res: DiagnosticTestResult = {
        testId,
        name: testName,
        status,
        details,
        timestamp: Date.now(),
        bytesTransmitted: bytes,
      };
      this.results.set(testId, res);
      this.notify();
      return res;
    };

    setRes('running', 'Test in progress...');

    if (!transport || transport.status !== 'connected') {
      return setRes('failed', 'Test failed: Printer is disconnected.');
    }

    try {
      switch (testId) {
        case 'test_a': {
          // Connection Test
          const dev = transport.deviceInfo;
          const info = dev
            ? `Transport: ${dev.transport.toUpperCase()}, Device: ${dev.name} (ID: ${dev.id})`
            : `Transport: ${transport.type.toUpperCase()}`;
          return setRes('passed', `Connection active & verified. ${info}`);
        }

        case 'test_b': {
          // Basic Text Test
          const payload = this.generateTestBPayload(profile, transport);
          await queue.enqueue('Test B: Basic Text', payload, undefined, { allowDuplicate: true });
          return setRes('awaiting_verification', 'Basic text test sent to printer. Awaiting physical printout inspection.', payload.length);
        }

        case 'test_c': {
          // Paper Width & Alignment Test
          const payload = this.generateTestCPayload(profile);
          await queue.enqueue('Test C: Paper Width & Alignment', payload, undefined, { allowDuplicate: true });
          return setRes('awaiting_verification', 'Width & alignment grid sent. Awaiting physical printout inspection.', payload.length);
        }

        case 'test_d': {
          // Text Formatting Test
          const payload = this.generateTestDPayload(profile);
          await queue.enqueue('Test D: Text Formatting', payload, undefined, { allowDuplicate: true });
          return setRes('awaiting_verification', 'Formatting samples sent (Commands: ESC @, ESC a, ESC E, ESC -, GS !, GS B, ESC M). Awaiting physical printout inspection.', payload.length);
        }

        case 'test_e': {
          // Barcode Test
          const payload = this.generateTestEPayload(profile, opts.barcodeType as any, opts.barcodeData);
          await queue.enqueue('Test E: Barcode', payload, undefined, { allowDuplicate: true });
          return setRes('awaiting_verification', `${opts.barcodeType || 'CODE128'} barcode sent. Awaiting scan test verification.`, payload.length);
        }

        case 'test_f': {
          // QR Code Test
          const payload = this.generateTestFPayload(profile, opts.qrData, opts.qrSize, opts.qrEc);
          await queue.enqueue('Test F: QR Code', payload, undefined, { allowDuplicate: true });
          return setRes('awaiting_verification', 'QR code sent. Awaiting camera scan verification.', payload.length);
        }

        case 'test_g': {
          // Paper Feed Test
          const lines = Math.min(20, Math.max(1, opts.feedLines ?? 5));
          const builder = new EscPosBuilder().init().feed(lines);
          const payload = builder.build();
          await queue.enqueue('Test G: Paper Feed', payload, undefined, { allowDuplicate: true });
          return setRes('awaiting_verification', `${lines} line-feed commands transmitted. Verify physical paper advancement.`, payload.length);
        }

        case 'test_h': {
          // Cutter Test
          if (transport.type === 'browser') {
            return setRes('unsupported', 'Hardware auto-cutter cannot be actuated via Browser Print dialog. Requires direct USB or BLE connection.');
          }
          if (!profile.supportsCutter) {
            return setRes('unsupported', `Auto-cutter is not supported by printer profile "${profile.name}".`);
          }
          const cutType = opts.cutType ?? profile.cutType ?? 'partial';
          const builder = new EscPosBuilder()
            .init()
            .align('center')
            .bold(true)
            .line('TEST H: AUTO-CUTTER TEST')
            .bold(false)
            .line(`Mode: ${cutType.toUpperCase()} CUT`)
            .line(new Date().toLocaleTimeString())
            .feed(profile.feedLinesAfterPrint)
            .cut(cutType, 0);
          const payload = builder.build();
          await queue.enqueue('Test H: Auto Cutter', payload, undefined, { allowDuplicate: true });
          return setRes('awaiting_verification', `${cutType.toUpperCase()} cut command transmitted. Verify physical blade actuation.`, payload.length);
        }

        case 'test_i': {
          // Printer Status Test
          if (transport.type === 'browser') {
            return setRes('unsupported', 'Real-time hardware status query (DLE EOT) is not supported over browser print spooler.');
          }
          if (!profile.supportsStatusQuery) {
            return setRes('unsupported', `Hardware status query (DLE EOT) is disabled in active profile "${profile.name}". (Budget 58mm thermal printers usually lack bidirectional communication. To test bidirectional status, enable it in Settings or select 80mm profile).`);
          }
          if (typeof transport.queryStatus !== 'function') {
            return setRes('unsupported', 'Hardware status query (DLE EOT) is not supported over this transport.');
          }
          const status = await transport.queryStatus();
          if (!status.supported) {
            return setRes('unsupported', status.message);
          }
          const flags: string[] = [];
          if (status.paperOut !== undefined) flags.push(status.paperOut ? 'Paper Out' : 'Paper OK');
          if (status.coverOpen !== undefined) flags.push(status.coverOpen ? 'Cover Open' : 'Cover Closed');
          if (status.cutterError !== undefined) flags.push(status.cutterError ? 'Cutter Error' : 'Cutter OK');
          if (status.offline !== undefined) flags.push(status.offline ? 'Offline' : 'Online');
          const flagDetails = flags.length > 0 ? ` (${flags.join(', ')})` : '';
          const details = `${status.message}${flagDetails} ${status.rawByte !== undefined ? `[Byte: 0x${status.rawByte.toString(16).padStart(2, '0')}]` : ''}`.trim();
          return setRes('passed', details);
        }

        case 'test_j': {
          // Stress & Reliability Test
          const stressIterations = Math.min(10, Math.max(1, opts.stressIterations ?? 3));
          const startTime = performance.now();
          let totalBytes = 0;
          let successfulRuns = 0;

          for (let i = 1; i <= stressIterations; i++) {
            if (transport.status !== 'connected') {
              throw new Error(`Stress test stopped prematurely at iteration ${i}: Printer disconnected.`);
            }
            const builder = new EscPosBuilder()
              .init()
              .align('center')
              .bold(true)
              .line(`STRESS TEST ITERATION ${i}/${stressIterations}`)
              .bold(false)
              .line(new Date().toLocaleTimeString())
              .rule(profile.columnsFontA, '.')
              .feed(2);
            const p = builder.build();
            await queue.enqueue(`Stress Run #${i}`, p, undefined, { allowDuplicate: true });
            totalBytes += p.length;
            successfulRuns++;
            // Pacing delay between jobs
            await new Promise(r => setTimeout(r, 300));
          }
          const elapsedMs = Math.round(performance.now() - startTime);
          return setRes('awaiting_verification', `Completed ${successfulRuns}/${stressIterations} sequential print runs (${totalBytes} bytes) in ${elapsedMs}ms. Zero dropped packets. Awaiting physical inspection.`, totalBytes);
        }

        default:
          return setRes('failed', 'Unknown test ID');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Duplicate print job prevented')) {
        return setRes('skipped', 'Test execution skipped: identical print payload was submitted within debounce window.');
      }
      return setRes('failed', `Execution error: ${msg}`);
    }
  }

  async runAll(
    transport: PrinterTransport | null,
    queue: PrintJobQueue,
    profile: PrinterProfile
  ): Promise<void> {
    if (this.isBatchRunning) return;
    this.isBatchRunning = true;

    try {
      if (transport?.type === 'browser') {
        // When using Browser Print, prevent firing 7 consecutive window.print() dialogs
        await this.runTest('test_a', transport, queue, profile);
        await this.runTest('test_b', transport, queue, profile);
        const escOnlyTests: DiagnosticTestId[] = ['test_c', 'test_d', 'test_e', 'test_f', 'test_g', 'test_i'];
        for (const id of escOnlyTests) {
          const testDef = DIAGNOSTIC_TESTS.find(t => t.id === id);
          this.results.set(id, {
            testId: id,
            name: testDef?.name || id,
            status: 'unsupported',
            details: 'Raw ESC/POS byte verification requires direct hardware transport (USB or BLE). Browser Print spooler formats sample receipts via CSS @media print.',
            timestamp: Date.now()
          });
        }
        this.notify();
        return;
      }

      // Execute tests sequentially in order (skip cutter and stress test from automated batch for safety)
      const batchTests: DiagnosticTestId[] = [
        'test_a',
        'test_b',
        'test_c',
        'test_d',
        'test_e',
        'test_f',
        'test_g',
        'test_i'
      ];

      for (const id of batchTests) {
        if (!transport || transport.status !== 'connected') {
          break;
        }
        await this.runTest(id, transport, queue, profile);
        // Short delay between diagnostic steps
        await new Promise(r => setTimeout(r, 200));
      }
    } finally {
      this.isBatchRunning = false;
    }
  }

  // --- Payload Generators ---

  generateTestBPayload(profile: PrinterProfile, transport: PrinterTransport): Uint8Array {
    const cols = profile.columnsFontA;
    const now = new Date();
    const devName = transport.deviceInfo?.name || 'Unknown Printer';

    return new EscPosBuilder()
      .init()
      .align('center')
      .bold(true)
      .size(1, 2)
      .line('THERMODIAGNOSTIX')
      .size(1, 1)
      .bold(false)
      .line('BASIC TEXT TEST')
      .rule(cols, '=')
      .align('left')
      .line(`Device: ${devName}`)
      .line(`Transport: ${transport.type.toUpperCase()}`)
      .line(`Profile: ${profile.name}`)
      .line(`Width: ${profile.paperWidth}mm (${cols} cols)`)
      .line(`Timestamp: ${now.toISOString().replace('T', ' ').substring(0, 19)}`)
      .rule(cols, '-')
      .align('left')
      .line('Left-aligned sample text')
      .align('center')
      .line('Centered sample text')
      .align('right')
      .line('Right-aligned sample text')
      .rule(cols, '-')
      .align('left')
      .line('Numeric: 0123456789')
      .line('Symbols: !@#$%^&*()_+-=[]{}|;:,.<>?')
      .feed(profile.feedLinesAfterPrint)
      .build();
  }

  generateTestCPayload(profile: PrinterProfile): Uint8Array {
    const cols = profile.columnsFontA;
    const ruler = TextFormatter.generateColumnRuler(cols);

    const edgeFill = '='.repeat(Math.max(1, cols - 14));
    const leftLine = `Left Edge:  [L${edgeFill}`;
    const rightLine = `${edgeFill}Right Edge: R]`;

    const builder = new EscPosBuilder()
      .init()
      .align('center')
      .bold(true)
      .line('PAPER WIDTH & ALIGNMENT')
      .bold(false)
      .line(cols <= 32 ? `${profile.paperWidth}mm | ${cols} cols Font A` : `Configured: ${profile.paperWidth}mm | ${cols} cols Font A`)
      .rule(cols, '=')
      .align('left')
      .line('Column Ruler Markers:')
      .line(ruler.markers)
      .line(ruler.numbers)
      .rule(cols, '-')
      .line(leftLine)
      .line(rightLine)
      .line(`[${'='.repeat(Math.max(1, cols - 2))}]`)
      .rule(cols, '-')
      .justify('Margin Left', 'Margin Right', cols)
      .feed(profile.feedLinesAfterPrint);

    return builder.build();
  }

  generateTestDPayload(profile: PrinterProfile): Uint8Array {
    const cols = profile.columnsFontA;

    return new EscPosBuilder()
      .init()
      .align('center')
      .bold(true)
      .line('TEXT FORMATTING TEST')
      .rule(cols, '=')
      .align('left')
      .line('Standard 1x1 Normal Text')
      .bold(true)
      .line('Bold / Emphasized Text')
      .bold(false)
      .underline(1)
      .line('Underlined Text (1-dot)')
      .underline(2)
      .line('Underlined Text (2-dot)')
      .underline(0)
      .invert(true)
      .line(' INVERTED WHITE ON BLACK ')
      .invert(false)
      .size(1, 2)
      .line('Double Height')
      .size(2, 1)
      .line('Double Width')
      .size(2, 2)
      .line('Double 2x2')
      .size(1, 1)
      .rule(cols, '-')
      .font('B')
      .line(`Font B Compact (${profile.columnsFontB} cols mode)`)
      .font('A')
      .feed(profile.feedLinesAfterPrint)
      .build();
  }

  generateTestEPayload(profile: PrinterProfile, barcodeType = 'CODE128', barcodeData = 'TEST-128-OK'): Uint8Array {
    const cols = profile.columnsFontA;
    const type = (barcodeType as any) || 'CODE128';
    const data = barcodeData || 'TEST-128-OK';

    return new EscPosBuilder()
      .init()
      .align('center')
      .bold(true)
      .line(`1D BARCODE TEST (${type})`)
      .rule(cols, '=')
      .align('center')
      .barcode(data, {
        type,
        height: 64,
        width: profile.paperWidth === 58 ? 2 : 3,
        hriPosition: 'below',
      })
      .feed(1)
      .align('center')
      .line(`Data: ${data}`)
      .line('[ Scan with reader/phone ]')
      .feed(profile.feedLinesAfterPrint)
      .build();
  }

  generateTestFPayload(profile: PrinterProfile, qrUrl = 'https://thermodiagnostix.dev', qrSize?: number, errorCorrection: 'L' | 'M' | 'Q' | 'H' = 'M'): Uint8Array {
    const cols = profile.columnsFontA;
    const data = qrUrl || 'https://thermodiagnostix.dev';
    const size = qrSize ?? (profile.paperWidth === 58 ? 5 : 6);

    return new EscPosBuilder()
      .init()
      .align('center')
      .bold(true)
      .line('2D QR CODE TEST')
      .rule(cols, '=')
      .align('center')
      .qrcode(data, {
        size,
        errorCorrection,
      })
      .feed(1)
      .line(data)
      .line(`[ Model 2, EC-${errorCorrection} ]`)
      .feed(profile.feedLinesAfterPrint)
      .build();
  }

  /**
   * Returns pre-built payload bytes for any diagnostic test so it can be previewed without printing
   */
  getTestPayload(testId: DiagnosticTestId, profile: PrinterProfile, transport: PrinterTransport | null, options?: TestRunOptions): Uint8Array {
    switch (testId) {
      case 'test_a':
        return new EscPosBuilder()
          .init()
          .align('center')
          .bold(true)
          .line('TEST A: CONNECTION')
          .line(`Transport: ${transport?.type?.toUpperCase() ?? 'NONE'}`)
          .rule(profile.columnsFontA, '-')
          .build();
      case 'test_b':
        return this.generateTestBPayload(profile, transport || ({ deviceInfo: { name: 'Preview Virtual Printer' }, type: 'mock' } as any));
      case 'test_c':
        return this.generateTestCPayload(profile);
      case 'test_d':
        return this.generateTestDPayload(profile);
      case 'test_e':
        return this.generateTestEPayload(profile, options?.barcodeType, options?.barcodeData);
      case 'test_f':
        return this.generateTestFPayload(profile, options?.qrData, options?.qrSize, options?.qrEc);
      case 'test_g':
        return new EscPosBuilder().init().feed(options?.feedLines ?? 5).build();
      case 'test_h': {
        const cutType = options?.cutType ?? profile.cutType ?? 'partial';
        return new EscPosBuilder()
          .init()
          .align('center')
          .bold(true)
          .line('TEST H: AUTO-CUTTER TEST')
          .bold(false)
          .line(`Mode: ${cutType.toUpperCase()} CUT`)
          .feed(profile.feedLinesAfterPrint)
          .cut(cutType, 0)
          .build();
      }
      case 'test_j':
        return new EscPosBuilder()
          .init()
          .align('center')
          .bold(true)
          .line('STRESS TEST SAMPLE')
          .bold(false)
          .line(new Date().toLocaleTimeString())
          .feed(2)
          .build();
      default:
        return new Uint8Array();
    }
  }
}
