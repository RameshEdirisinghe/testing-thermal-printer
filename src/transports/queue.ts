import { PrintJob, PrinterTransport, TransferResult } from '../types/transport';
import { BasePrinterTransport } from './base';

export class PrintJobQueue {
  private queue: PrintJob[] = [];
  private activeJob: PrintJob | null = null;
  private isProcessing = false;
  private transport: PrinterTransport | null = null;
  private listeners: Set<(queue: PrintJob[], active: PrintJob | null) => void> = new Set();
  private unsubscribeTransportState: (() => void) | null = null;

  setTransport(transport: PrinterTransport | null): void {
    if (this.unsubscribeTransportState) {
      this.unsubscribeTransportState();
      this.unsubscribeTransportState = null;
    }

    this.transport = transport;

    if (transport) {
      this.unsubscribeTransportState = transport.onStateChange(status => {
        if (status === 'disconnected' || status === 'error') {
          this.handleTransportDisconnect();
        }
      });
    }
  }

  getQueue(): PrintJob[] {
    return [...this.queue];
  }

  getActiveJob(): PrintJob | null {
    return this.activeJob;
  }

  subscribe(listener: (queue: PrintJob[], active: PrintJob | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.queue, this.activeJob);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.queue, this.activeJob);
      } catch (err) {
        console.error('Error in queue listener:', err);
      }
    }
  }

  private lastSubmissionFingerprint: string | null = null;
  private lastSubmissionTime = 0;
  private duplicateDebounceMs = 1000;

  enqueue(
    title: string,
    data: Uint8Array,
    onProgress?: (progress: { sent: number; total: number; percentage: number }) => void,
    options?: { allowDuplicate?: boolean }
  ): Promise<TransferResult> {
    return new Promise((resolve, reject) => {
      if (!this.transport || this.transport.status !== 'connected') {
        const errorMsg = 'Cannot queue print job: Printer is not connected.';
        BasePrinterTransport.emitLog('error', 'queue', errorMsg);
        return reject(new Error(errorMsg));
      }

      // Accidental duplicate submission prevention
      const now = Date.now();
      const fingerprint = `${title}-${data.length}-${data.slice(0, 16).join(',')}`;
      if (!options?.allowDuplicate && fingerprint === this.lastSubmissionFingerprint && (now - this.lastSubmissionTime) < this.duplicateDebounceMs) {
        const dupeMsg = 'Duplicate print job prevented: Identical print payload submitted within debounce window.';
        BasePrinterTransport.emitLog('warn', 'queue', dupeMsg);
        return reject(new Error(dupeMsg));
      }
      this.lastSubmissionFingerprint = fingerprint;
      this.lastSubmissionTime = now;

      const job: PrintJob = {
        id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        data,
        createdAt: Date.now(),
        status: 'pending',
        bytesSent: 0,
        totalBytes: data.length,
        onProgress
      };

      // Internal wrapper to complete promise
      const wrappedJob = Object.assign(job, {
        _resolve: resolve,
        _reject: reject
      });

      this.queue.push(wrappedJob as unknown as PrintJob);
      this.notify();
      this.processNext();
    });
  }

  cancelJob(jobId: string): boolean {
    const index = this.queue.findIndex(j => j.id === jobId);
    if (index !== -1) {
      const [removed] = this.queue.splice(index, 1);
      removed.status = 'cancelled';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (removed as any)._reject?.(new Error('Print job cancelled by user'));
      this.notify();
      return true;
    }
    return false;
  }

  clearQueue(): void {
    while (this.queue.length > 0) {
      const removed = this.queue.shift();
      if (removed) {
        removed.status = 'cancelled';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (removed as any)._reject?.(new Error('Print queue cleared'));
      }
    }
    this.notify();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    if (!this.transport || this.transport.status !== 'connected') {
      return;
    }

    this.isProcessing = true;
    const currentJob = this.queue.shift()!;
    this.activeJob = currentJob;
    currentJob.status = 'printing';
    this.notify();

    try {
      const result = await this.transport.send(currentJob.data, (sent, total) => {
        currentJob.bytesSent = sent;
        const percentage = Math.round((sent / total) * 100);
        if (currentJob.onProgress) {
          currentJob.onProgress({ sent, total, percentage });
        }
        this.notify();
      });

      currentJob.status = 'completed';
      this.notify();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (currentJob as any)._resolve?.(result);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      currentJob.status = 'failed';
      currentJob.error = errMsg;
      this.notify();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (currentJob as any)._reject?.(err instanceof Error ? err : new Error(errMsg));
    } finally {
      this.activeJob = null;
      this.isProcessing = false;
      this.notify();

      // Continue queue
      if (this.queue.length > 0 && this.transport?.status === 'connected') {
        this.processNext();
      }
    }
  }

  private handleTransportDisconnect(): void {
    if (this.activeJob) {
      this.activeJob.status = 'failed';
      this.activeJob.error = 'Printer disconnected during transmission';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.activeJob as any)._reject?.(new Error('Printer disconnected during transmission'));
      this.activeJob = null;
    }

    this.isProcessing = false;
    // Notify all queued jobs of cancellation
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        item.status = 'failed';
        item.error = 'Printer disconnected';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item as any)._reject?.(new Error('Printer disconnected'));
      }
    }

    this.notify();
  }
}
