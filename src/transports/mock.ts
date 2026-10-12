import { BasePrinterTransport } from './base';
import { DeviceInfo, PrinterStatusFlags, TransferResult } from '../types/transport';

export interface MockOptions {
  name?: string;
  simulateDelayMs?: number;
  failNextSend?: boolean;
  failConnect?: boolean;
  paperOut?: boolean;
}

export class MockPrinterTransport extends BasePrinterTransport {
  readonly type = 'mock' as const;

  private simulateDelayMs = 200;
  private failNextSend = false;
  private failConnect = false;
  private isPaperOut = false;
  private capturedBytes: Uint8Array[] = [];

  constructor(options: MockOptions = {}) {
    super();
    this.simulateDelayMs = options.simulateDelayMs ?? 200;
    this.failNextSend = options.failNextSend ?? false;
    this.failConnect = options.failConnect ?? false;
    this.isPaperOut = options.paperOut ?? false;
  }

  setFailNextSend(fail: boolean): void {
    this.failNextSend = fail;
  }

  setFailConnect(fail: boolean): void {
    this.failConnect = fail;
  }

  setPaperOut(out: boolean): void {
    this.isPaperOut = out;
  }

  getCapturedBytes(): Uint8Array[] {
    return [...this.capturedBytes];
  }

  clearCapturedBytes(): void {
    this.capturedBytes = [];
  }

  async connect(options?: MockOptions): Promise<DeviceInfo> {
    this.setStatus('connecting', null);
    this.log('info', 'transport', 'Connecting to Mock Emulated Thermal Printer...');

    if (options?.failConnect || this.failConnect) {
      this.setStatus('error', null);
      this.log('error', 'transport', 'Simulated connection failure.');
      throw new Error('Mock connection simulated failure');
    }

    await new Promise(r => setTimeout(r, 80));

    const deviceInfo: DeviceInfo = {
      id: 'mock-thermal-printer-01',
      name: options?.name || 'Virtual Thermal Printer (Simulator)',
      transport: 'mock',
      isEmulated: true,
      connectedAt: Date.now()
    };

    this.setStatus('connected', deviceInfo);
    this.log('success', 'transport', `Mock printer connected: ${deviceInfo.name}`);
    return deviceInfo;
  }

  async disconnect(): Promise<void> {
    this.setStatus('disconnecting');
    await new Promise(r => setTimeout(r, 40));
    this.setStatus('disconnected', null);
    this.log('info', 'transport', 'Mock printer disconnected.');
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<TransferResult> {
    if (this._status !== 'connected') {
      throw new Error('Cannot send: Mock printer is not connected.');
    }

    if (this.failNextSend) {
      this.failNextSend = false;
      this.log('error', 'transport', 'Mock transport simulated write error.');
      throw new Error('Simulated write failure on mock transport');
    }

    const startTime = performance.now();
    const total = data.length;
    const steps = 4;
    const chunkSize = Math.ceil(total / steps);

    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, Math.max(10, Math.floor(this.simulateDelayMs / steps))));
      const sent = Math.min(i * chunkSize, total);
      if (onProgress) {
        onProgress(sent, total);
      }
    }

    this.capturedBytes.push(new Uint8Array(data));
    const duration = Math.round(performance.now() - startTime);
    this.log('success', 'transport', `Mock transmitted ${total} bytes in ${duration}ms`);

    return {
      success: true,
      bytesSent: total,
      durationMs: duration
    };
  }

  async queryStatus(): Promise<PrinterStatusFlags> {
    return {
      supported: true,
      message: this.isPaperOut ? 'Sensor Status: PAPER OUT' : 'Sensor Status: PAPER OK, READY',
      paperOut: this.isPaperOut,
      coverOpen: false,
      cutterError: false,
      offline: this.isPaperOut,
      rawByte: this.isPaperOut ? 0x20 : 0x00
    };
  }

  /**
   * Helper to simulate unexpected hardware disconnect
   */
  simulateUnexpectedDisconnect(): void {
    this.log('warn', 'transport', 'Mock simulated unexpected hardware disconnection!');
    this.setStatus('disconnected', null);
  }
}
