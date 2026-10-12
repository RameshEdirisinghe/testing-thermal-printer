export type DiagnosticTestId =
  | 'test_a' // Connection Test
  | 'test_b' // Basic Text Test
  | 'test_c' // Paper Width & Alignment Test
  | 'test_d' // Text Formatting Test
  | 'test_e' // Barcode Test
  | 'test_f' // QR Code Test
  | 'test_g' // Paper Feed Test
  | 'test_h' // Cutter Test
  | 'test_i' // Printer Status Test
  | 'test_j'; // Stress & Reliability Test

export type DiagnosticTestStatus =
  | 'idle'
  | 'running'
  | 'awaiting_verification'
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'unsupported';

export interface DiagnosticTestResult {
  testId: DiagnosticTestId;
  name: string;
  status: DiagnosticTestStatus;
  details: string;
  timestamp: number;
  bytesTransmitted?: number;
  userVerification?: 'passed' | 'failed' | 'skipped';
  userNotes?: string;
}

export interface DiagnosticTestDefinition {
  id: DiagnosticTestId;
  name: string;
  category: 'connection' | 'text' | 'layout' | 'graphics' | 'hardware' | 'stress';
  description: string;
  requiresHardwarePrint: boolean;
  requiresConfirmationModal?: boolean;
  expectedVisualDescription: string;
}
