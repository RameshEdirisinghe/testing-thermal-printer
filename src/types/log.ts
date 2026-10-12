export type LogSeverity = 'info' | 'success' | 'warn' | 'error';

export type LogCategory = 'transport' | 'bluetooth' | 'usb' | 'escpos' | 'test' | 'queue' | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
}
