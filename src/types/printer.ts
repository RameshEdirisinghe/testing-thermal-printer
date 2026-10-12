export type PaperWidth = 58 | 80;

export interface PrinterProfile {
  id: string;
  name: string;
  paperWidth: PaperWidth;
  printableDots: number; // e.g. 384 for 58mm, 576 for 80mm
  columnsFontA: number; // e.g. 32 for 58mm, 48 for 80mm
  columnsFontB: number; // e.g. 42 for 58mm, 64 for 80mm
  defaultEncoding: string; // 'ascii' | 'cp437' | 'utf-8'
  feedLinesAfterPrint: number; // e.g. 3
  supportsCutter: boolean;
  supportsStatusQuery: boolean;
  bleMtuChunkSize: number; // e.g. 64 or 128 bytes
  blePacingMs: number; // e.g. 15 ms delay between BLE chunks
  usbChunkSize: number; // e.g. 512 bytes
  marginLeftDots?: number; // hardware left margin in dots
  marginRightDots?: number; // hardware right margin in dots
  defaultAlignment?: 'left' | 'center' | 'right';
  lineSpacingDots?: number; // line spacing in dots (e.g. 30)
  cutType?: 'partial' | 'full';
}

export interface DeviceInfo {
  id: string;
  name: string;
  transport: 'bluetooth' | 'usb' | 'browser' | 'mock';
  gattServiceUuid?: string;
  gattCharUuid?: string;
  usbVendorId?: number;
  usbProductId?: number;
  usbManufacturerName?: string;
  usbProductName?: string;
  isEmulated?: boolean;
  connectedAt?: number;
}
