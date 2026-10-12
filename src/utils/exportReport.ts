import { DiagnosticTestResult } from '../types/test';
import { LogEntry } from '../types/log';
import { PrinterProfile, DeviceInfo } from '../types/printer';
import { BrowserEnvironmentInfo } from './browserDetection';

export interface DiagnosticSessionExport {
  exportDate: string;
  appVersion: string;
  environment: BrowserEnvironmentInfo;
  profile: PrinterProfile;
  device: DeviceInfo | null;
  testResults: DiagnosticTestResult[];
  logs: LogEntry[];
}

export function generateDiagnosticJson(
  env: BrowserEnvironmentInfo,
  profile: PrinterProfile,
  device: DeviceInfo | null,
  results: DiagnosticTestResult[],
  logs: LogEntry[]
): string {
  const payload: DiagnosticSessionExport = {
    exportDate: new Date().toISOString(),
    appVersion: '1.0.0',
    environment: env,
    profile,
    device,
    testResults: results,
    logs,
  };
  return JSON.stringify(payload, null, 2);
}

export function generateDiagnosticTxt(
  env: BrowserEnvironmentInfo,
  profile: PrinterProfile,
  device: DeviceInfo | null,
  results: DiagnosticTestResult[],
  logs: LogEntry[]
): string {
  const lines: string[] = [];
  lines.push('================================================================');
  lines.push('       THERMODIAGNOSTIX HARDWARE DIAGNOSTIC REPORT              ');
  lines.push('================================================================');
  lines.push(`Export Date  : ${new Date().toISOString()}`);
  lines.push(`Browser / OS : ${env.browserName} on ${env.osName}`);
  lines.push(`Secure Ctx   : ${env.isSecureContext ? 'YES (Secure)' : 'NO (Insecure)'}`);
  lines.push(`Bluetooth    : ${env.hasWebBluetooth ? 'Available' : 'Unavailable'}`);
  lines.push(`WebUSB       : ${env.hasWebUsb ? 'Available' : 'Unavailable'}`);
  lines.push('----------------------------------------------------------------');
  lines.push('ACTIVE PRINTER PROFILE');
  lines.push(`Profile Name : ${profile.name} (ID: ${profile.id})`);
  lines.push(`Paper Width  : ${profile.paperWidth} mm (${profile.printableDots} dots)`);
  lines.push(`Columns      : Font A: ${profile.columnsFontA} cols | Font B: ${profile.columnsFontB} cols`);
  lines.push(`Cutter Supp. : ${profile.supportsCutter ? 'Yes' : 'No'}`);
  lines.push(`Status Query : ${profile.supportsStatusQuery ? 'Yes' : 'No'}`);
  lines.push('----------------------------------------------------------------');
  lines.push('CONNECTED HARDWARE');
  if (device) {
    lines.push(`Device Name  : ${device.name}`);
    lines.push(`Transport    : ${device.transport.toUpperCase()}`);
    lines.push(`Device ID    : ${device.id}`);
    if (device.gattServiceUuid) lines.push(`GATT Service : ${device.gattServiceUuid}`);
    if (device.gattCharUuid) lines.push(`GATT Char    : ${device.gattCharUuid}`);
    if (device.usbVendorId) lines.push(`USB VID:PID  : 0x${device.usbVendorId.toString(16)}:0x${device.usbProductId?.toString(16)}`);
  } else {
    lines.push('No hardware currently connected.');
  }
  lines.push('================================================================');
  lines.push('DIAGNOSTIC TEST RESULTS');
  lines.push('----------------------------------------------------------------');

  for (const r of results) {
    const statusFormatted = `[${r.status.toUpperCase()}]`.padEnd(24);
    lines.push(`${r.name}`);
    lines.push(`Status : ${statusFormatted}`);
    lines.push(`Detail : ${r.details}`);
    if (r.bytesTransmitted) lines.push(`Bytes  : ${r.bytesTransmitted} bytes transmitted`);
    if (r.userVerification) lines.push(`Operator Verification: ${r.userVerification.toUpperCase()}`);
    if (r.userNotes) lines.push(`Notes  : ${r.userNotes}`);
    lines.push('');
  }

  lines.push('================================================================');
  lines.push(`ACTIVITY LOG (${logs.length} entries)`);
  lines.push('----------------------------------------------------------------');

  for (const log of logs) {
    lines.push(`[${log.timestamp}] [${log.severity.toUpperCase().padEnd(7)}] [${log.category}] ${log.message}`);
  }

  lines.push('================================================================');
  lines.push('END OF REPORT');

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
