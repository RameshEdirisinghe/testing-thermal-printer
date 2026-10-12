import { DeviceInfo } from './printer';
export type { DeviceInfo };

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

export interface TransferResult {
  success: boolean;
  bytesSent: number;
  durationMs: number;
  error?: string;
}

export interface PrinterStatusFlags {
  supported: boolean;
  message: string;
  paperOut?: boolean;
  coverOpen?: boolean;
  cutterError?: boolean;
  offline?: boolean;
  rawByte?: number;
}

export interface PrintJob {
  id: string;
  title: string;
  data: Uint8Array;
  createdAt: number;
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'cancelled';
  bytesSent: number;
  totalBytes: number;
  error?: string;
  onProgress?: (progress: { sent: number; total: number; percentage: number }) => void;
}

export interface PrinterTransport {
  readonly type: 'bluetooth' | 'usb' | 'browser' | 'mock';
  readonly status: ConnectionStatus;
  readonly deviceInfo: DeviceInfo | null;
  
  connect(options?: Record<string, unknown>): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<TransferResult>;
  queryStatus?(): Promise<PrinterStatusFlags>;
  
  onStateChange(listener: (status: ConnectionStatus, info: DeviceInfo | null) => void): () => void;
}
