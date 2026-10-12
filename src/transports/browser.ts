import { BasePrinterTransport } from './base';
import { DeviceInfo, TransferResult } from '../types/transport';
import { TextFormatter } from '../escpos/formatter';

export class BrowserPrintTransport extends BasePrinterTransport {
  readonly type = 'browser' as const;
  private static printPayloadListeners: Set<(text: string | null) => void> = new Set();

  static onPrintPayload(listener: (text: string | null) => void): () => void {
    BrowserPrintTransport.printPayloadListeners.add(listener);
    return () => {
      BrowserPrintTransport.printPayloadListeners.delete(listener);
    };
  }

  private static notifyPrintPayload(text: string | null): void {
    for (const listener of BrowserPrintTransport.printPayloadListeners) {
      try {
        listener(text);
      } catch (err) {
        console.error('Error in print payload listener:', err);
      }
    }
  }

  async connect(): Promise<DeviceInfo> {
    const deviceInfo: DeviceInfo = {
      id: 'browser-print-engine',
      name: 'System Print Spooler (Browser Fallback)',
      transport: 'browser',
      connectedAt: Date.now()
    };
    this.setStatus('connected', deviceInfo);
    this.log('info', 'transport', 'Browser Print fallback active. System print dialog will be triggered for print operations.');
    return deviceInfo;
  }

  async disconnect(): Promise<void> {
    this.setStatus('disconnected', null);
    this.log('info', 'transport', 'Browser Print fallback disconnected.');
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<TransferResult> {
    if (this._status !== 'connected') {
      throw new Error('Browser print fallback is not connected.');
    }

    const totalBytes = data.length;
    this.log('info', 'transport', `Invoking window.print() for ${totalBytes} bytes receipt payload...`);

    if (onProgress) {
      onProgress(Math.floor(totalBytes / 2), totalBytes);
    }

    // Extract readable text lines from the ESC/POS payload for the printable DOM
    const printableText = TextFormatter.extractReadableLines(data);
    BrowserPrintTransport.notifyPrintPayload(printableText);

    // Short tick to allow React DOM to render the printable payload before invoking browser print dialog
    await new Promise(r => setTimeout(r, 60));

    // Trigger browser print dialog
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }

    // Reset printable payload back to default after print dialog closes
    BrowserPrintTransport.notifyPrintPayload(null);

    if (onProgress) {
      onProgress(totalBytes, totalBytes);
    }

    this.log('success', 'transport', 'System print dialog completed.');

    return {
      success: true,
      bytesSent: totalBytes,
      durationMs: 100
    };
  }
}

