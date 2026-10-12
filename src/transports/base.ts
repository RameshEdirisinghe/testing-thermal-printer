import { ConnectionStatus, DeviceInfo, PrinterStatusFlags, PrinterTransport, TransferResult } from '../types/transport';
import { LogCategory, LogSeverity } from '../types/log';

export abstract class BasePrinterTransport implements PrinterTransport {
  abstract readonly type: 'bluetooth' | 'usb' | 'browser' | 'mock';
  
  protected _status: ConnectionStatus = 'disconnected';
  protected _deviceInfo: DeviceInfo | null = null;
  
  private stateListeners: Set<(status: ConnectionStatus, info: DeviceInfo | null) => void> = new Set();
  private static logListeners: Set<(severity: LogSeverity, category: LogCategory, message: string, data?: Record<string, unknown>) => void> = new Set();

  get status(): ConnectionStatus {
    return this._status;
  }

  get deviceInfo(): DeviceInfo | null {
    return this._deviceInfo;
  }

  abstract connect(options?: Record<string, unknown>): Promise<DeviceInfo>;
  abstract disconnect(): Promise<void>;
  abstract send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<TransferResult>;

  async queryStatus?(): Promise<PrinterStatusFlags> {
    return {
      supported: false,
      message: 'Status query is not supported by this transport adapter',
    };
  }

  protected setStatus(status: ConnectionStatus, info: DeviceInfo | null = this._deviceInfo): void {
    this._status = status;
    this._deviceInfo = info;
    this.notifyStateListeners();
  }

  onStateChange(listener: (status: ConnectionStatus, info: DeviceInfo | null) => void): () => void {
    this.stateListeners.add(listener);
    // Notify immediate initial state
    listener(this._status, this._deviceInfo);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private notifyStateListeners(): void {
    for (const listener of this.stateListeners) {
      try {
        listener(this._status, this._deviceInfo);
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    }
  }

  static onLog(listener: (severity: LogSeverity, category: LogCategory, message: string, data?: Record<string, unknown>) => void): () => void {
    this.logListeners.add(listener);
    return () => {
      this.logListeners.delete(listener);
    };
  }

  static emitLog(severity: LogSeverity, category: LogCategory, message: string, data?: Record<string, unknown>): void {
    for (const listener of BasePrinterTransport.logListeners) {
      try {
        listener(severity, category, message, data);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    }
  }

  protected log(severity: LogSeverity, category: LogCategory, message: string, data?: Record<string, unknown>): void {
    BasePrinterTransport.emitLog(severity, category, message, data);
  }
}
