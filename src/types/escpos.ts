export type Alignment = 'left' | 'center' | 'right';

export interface TextFormat {
  bold?: boolean;
  underline?: boolean;
  doubleHeight?: boolean;
  doubleWidth?: boolean;
  invert?: boolean;
  font?: 'A' | 'B';
}

export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'ITF' | 'UPC-A' | 'UPC-E';

export type HriPosition = 'none' | 'above' | 'below' | 'both';

export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export type CutType = 'full' | 'partial';

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ReceiptCustomData {
  storeName: string;
  headerLines: string[];
  items: ReceiptItem[];
  footerLines: string[];
  barcodeValue?: string;
  qrValue?: string;
  includeCut: boolean;
  feedLines: number;
  alignment?: Alignment;
  headerAlignment?: Alignment;
  footerAlignment?: Alignment;
  fontStyle?: 'normal' | 'bold' | 'doubleWidth' | 'doubleHeight' | 'expanded';
  lineSpacing?: number;
}
